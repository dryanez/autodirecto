import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ── Supabase service-role client (bypasses RLS) ───────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Load agent prompt from project root ───────────────────────
let SYSTEM_PROMPT = '';
try {
  SYSTEM_PROMPT = readFileSync(
    join(process.cwd(), 'AGENT_PROMPT.md'),
    'utf-8'
  );
} catch (e) {
  console.error('[webhook] Failed to load AGENT_PROMPT.md:', e.message);
  SYSTEM_PROMPT = 'You are a helpful customer support assistant for Auto Directo, a car dealership in Chile.';
}

// ── Helpers ──────────────────────────────────────────────────

/** Extract phone + text from a Meta webhook payload */
function extractMessage(body) {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if (!message) return null;

    const phone = message.from;              // e.g. "56912345678"
    const waMessageId = message.id;
    const text =
      message.text?.body ||                  // regular text
      message.button?.text ||               // quick-reply button
      message.interactive?.button_reply?.title || // interactive button
      null;

    if (!phone || !text) return null;
    return { phone, text, waMessageId };
  } catch (e) {
    console.error('[webhook] extractMessage error:', e);
    return null;
  }
}

/** Get or create a wa_conversations row; returns the row */
async function upsertConversation(phone) {
  console.log(`[webhook] upsertConversation for ${phone}`);

  const { data, error } = await supabaseAdmin
    .from('wa_conversations')
    .upsert(
      { phone_number: phone },
      { onConflict: 'phone_number', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error('[webhook] upsertConversation error:', JSON.stringify(error));
    throw error;
  }
  return data;
}

/** Save a message row */
async function saveMessage(conversationId, role, content, waMessageId = null) {
  console.log(`[webhook] saveMessage conversation=${conversationId} role=${role}`);

  const payload = {
    conversation_id: conversationId,
    role,
    content,
  };
  if (waMessageId) payload.wa_message_id = waMessageId;

  const { error } = await supabaseAdmin
    .from('wa_messages')
    .insert(payload);

  if (error) {
    console.error('[webhook] saveMessage error:', JSON.stringify(error));
    // Don't throw — message saving failure shouldn't block the reply
  }
}

/** Update the conversation's last_message and unread_count */
async function updateConversationMeta(conversationId, lastMessage, isUser) {
  const { error } = await supabaseAdmin
    .from('wa_conversations')
    .update({
      last_message: lastMessage.slice(0, 120),
      last_message_at: new Date().toISOString(),
      unread_count: isUser
        ? supabaseAdmin.rpc // handled below via raw increment
        : undefined,
    })
    .eq('id', conversationId);

  if (isUser) {
    await supabaseAdmin.rpc('wa_increment_unread', { conv_id: conversationId });
  }

  if (error) {
    console.error('[webhook] updateConversationMeta error:', JSON.stringify(error));
  }
}

/** Fetch last N messages for context */
async function getRecentMessages(conversationId, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('wa_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[webhook] getRecentMessages error:', JSON.stringify(error));
    return [];
  }
  return (data || []).reverse(); // oldest first for OpenAI
}

/** Call OpenAI GPT-4o */
async function callOpenAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.65,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[webhook] OpenAI error:', res.status, err);
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || 'Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.';
}

/** Send a WhatsApp text message via Cloud API */
async function sendWhatsApp(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`[webhook] sendWhatsApp to=${to} chars=${text.length}`);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[webhook] WhatsApp send error:', res.status, err);
    throw new Error(`WhatsApp API ${res.status}: ${err}`);
  }

  return res.json();
}

// ── GET: Meta webhook verification ───────────────────────────
export async function GET(request) {
  console.log('[webhook] GET verification hit');

  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log('[webhook] Verification success');
    return new Response(challenge, { status: 200 });
  }

  console.error('[webhook] Verification failed — token mismatch or wrong mode');
  return new Response('Forbidden', { status: 403 });
}

// ── POST: Incoming WhatsApp message ──────────────────────────
export async function POST(request) {
  console.log('[webhook] POST received');

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('[webhook] Invalid JSON body:', e);
    return new Response('Bad Request', { status: 400 });
  }

  // Always return 200 immediately so Meta doesn't retry
  const respond = (status = 200) => new Response('OK', { status });

  // Ignore status updates (delivery receipts etc.)
  const messageType = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type;
  if (!messageType) {
    console.log('[webhook] No message in payload (likely status update) — ignoring');
    return respond();
  }

  const extracted = extractMessage(body);
  if (!extracted) {
    console.log('[webhook] Could not extract message — ignoring');
    return respond();
  }

  const { phone, text, waMessageId } = extracted;
  console.log(`[webhook] Message from ${phone}: "${text.slice(0, 80)}"`);

  // Process asynchronously so we return 200 instantly
  (async () => {
    try {
      // 1. Upsert conversation
      const conversation = await upsertConversation(phone);
      const convId = conversation.id;

      // 2. Save user message
      await saveMessage(convId, 'user', text, waMessageId);

      // 3. Update conversation meta (last message, unread)
      try {
        await supabaseAdmin
          .from('wa_conversations')
          .update({
            last_message: text.slice(0, 120),
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1,
            status: conversation.status === 'resolved' ? 'open' : conversation.status,
          })
          .eq('id', convId);
      } catch (e) {
        console.error('[webhook] update meta error:', e);
      }

      // 4. Get conversation history for context
      const history = await getRecentMessages(convId, 10);

      // 5. Call OpenAI
      const aiReply = await callOpenAI(history.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })));

      // 6. Send WhatsApp reply
      await sendWhatsApp(phone, aiReply);

      // 7. Save assistant message
      await saveMessage(convId, 'assistant', aiReply);

      // 8. Update last message to AI reply
      await supabaseAdmin
        .from('wa_conversations')
        .update({
          last_message: aiReply.slice(0, 120),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', convId);

      console.log(`[webhook] Replied to ${phone} successfully`);
    } catch (err) {
      console.error('[webhook] Processing error:', err);
    }
  })();

  return respond();
}

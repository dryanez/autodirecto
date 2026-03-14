export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request) {
  // Create client inside handler so env vars are resolved at runtime, not build time
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { conversationId } = await request.json();
    if (!conversationId) return new Response('Missing conversationId', { status: 400 });

    const { error } = await supabaseAdmin
      .from('wa_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (error) {
      console.error('[mark-read] Supabase error:', JSON.stringify(error));
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error('[mark-read] Error:', e);
    return new Response('Internal error', { status: 500 });
  }
}

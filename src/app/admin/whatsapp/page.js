'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Anon client for dashboard (respects RLS — authenticated users can read)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ── Helpers ──────────────────────────────────────────────────
function formatPhone(phone) {
  if (!phone) return '';
  const p = String(phone).replace(/\D/g, '');
  if (p.startsWith('56') && p.length === 11)
    return `+56 ${p.slice(2, 3)} ${p.slice(3, 7)} ${p.slice(7)}`;
  return `+${p}`;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

function formatMsgTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS = {
  open:     { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Activo' },
  resolved: { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', label: 'Resuelto' },
  spam:     { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', label: 'Spam' },
};

// ── Components ───────────────────────────────────────────────

function ConversationItem({ conv, active, onClick }) {
  const s = STATUS_COLORS[conv.status] || STATUS_COLORS.open;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
        background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', transition: 'background 0.15s',
        display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', fontWeight: 700, color: '#fff', position: 'relative',
      }}>
        {conv.display_name?.[0]?.toUpperCase() || conv.phone_number?.[0] || '?'}
        {conv.unread_count > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            background: '#25D366', color: '#fff',
            width: '16px', height: '16px', borderRadius: '50%',
            fontSize: '0.6rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
          <span style={{
            fontSize: '0.82rem', fontWeight: 600, color: '#e5e7eb',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px',
          }}>
            {conv.display_name || formatPhone(conv.phone_number)}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#6b7280', flexShrink: 0, marginLeft: '0.5rem' }}>
            {timeAgo(conv.last_message_at)}
          </span>
        </div>
        <div style={{
          fontSize: '0.72rem', color: '#9ca3af',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {conv.last_message || 'Sin mensajes'}
        </div>
      </div>
    </button>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end',
      marginBottom: '0.5rem', padding: '0 1rem',
    }}>
      <div style={{
        maxWidth: '72%',
        background: isUser
          ? 'rgba(255,255,255,0.07)'
          : 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        borderRadius: isUser ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        padding: '0.55rem 0.8rem',
        boxShadow: isUser
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(59,130,246,0.3)',
      }}>
        <p style={{
          margin: 0, fontSize: '0.82rem', color: isUser ? '#e5e7eb' : '#fff',
          lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </p>
        <span style={{
          display: 'block', textAlign: 'right',
          fontSize: '0.62rem', color: isUser ? '#6b7280' : 'rgba(255,255,255,0.55)',
          marginTop: '0.2rem',
        }}>
          {formatMsgTime(msg.created_at)}
          {!isUser && <span style={{ marginLeft: '0.3rem' }}>🤖</span>}
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function WhatsAppDashboard() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [stats, setStats]                 = useState({ total: 0, open: 0, today: 0 });
  const messagesEndRef = useRef(null);
  const convSubRef     = useRef(null);
  const msgSubRef      = useRef(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('wa_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('loadConversations error:', error);
      return;
    }
    const convs = data || [];
    setConversations(convs);
    setLoadingConvs(false);

    // Compute stats
    const today = new Date().toDateString();
    setStats({
      total: convs.length,
      open:  convs.filter(c => c.status === 'open').length,
      today: convs.filter(c => c.last_message_at && new Date(c.last_message_at).toDateString() === today).length,
    });
  }, []);

  // ── Load messages for active conversation ──
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    const { data, error } = await supabase
      .from('wa_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) console.error('loadMessages error:', error);
    setMessages(data || []);
    setLoadingMsgs(false);
  }, []);

  // ── Mark conversation as read ──
  const markAsRead = useCallback(async (convId) => {
    // We use the service role via an API call because the anon key
    // can't write — we expose a simple internal endpoint
    await fetch('/api/webhook/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId }),
    }).catch(() => {});
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
    );
  }, []);

  // ── Initial load ──
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Realtime: conversations ──
  useEffect(() => {
    const channel = supabase
      .channel('wa-conversations')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wa_conversations',
      }, () => loadConversations())
      .subscribe();

    convSubRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [loadConversations]);

  // ── Realtime: messages for active conversation ──
  useEffect(() => {
    if (msgSubRef.current) supabase.removeChannel(msgSubRef.current);
    if (!activeConvId) return;

    const channel = supabase
      .channel(`wa-messages-${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'wa_messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    msgSubRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [activeConvId]);

  // ── Scroll to bottom when messages change ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Select conversation ──
  const selectConversation = useCallback((conv) => {
    setActiveConvId(conv.id);
    loadMessages(conv.id);
    if (conv.unread_count > 0) markAsRead(conv.id);
  }, [loadMessages, markAsRead]);

  // ── Filtered conversations ──
  const filtered = conversations.filter(c => {
    const matchSearch = !search ||
      c.phone_number?.includes(search) ||
      c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeConv = conversations.find(c => c.id === activeConvId);

  // ── Styles ──────────────────────────────────────────────────
  const sidebarW = '280px';

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: '#0a0e1a', fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#e5e7eb',
    }}>

      {/* ══ LEFT SIDEBAR ═══════════════════════════════════════ */}
      <div style={{
        width: sidebarW, minWidth: sidebarW, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: '#0d1220',
      }}>

        {/* Header */}
        <div style={{
          padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(37,99,235,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>
              💬
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>WhatsApp AI</div>
              <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Auto Directo Agent</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { label: 'Total', value: stats.total, color: '#60a5fa' },
              { label: 'Activos', value: stats.open, color: '#4ade80' },
              { label: 'Hoy', value: stats.today, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                padding: '0.35rem 0.4rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.58rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#4b5563' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar conversaciones…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '0.45rem 0.75rem 0.45rem 1.8rem',
                color: '#e5e7eb', fontSize: '0.78rem', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['all', 'open', 'resolved', 'spam'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.2rem 0.55rem', borderRadius: '99px',
                border: `1px solid ${statusFilter === s ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                background: statusFilter === s ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: statusFilter === s ? '#60a5fa' : '#6b7280',
                fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? 'Todos' : STATUS_COLORS[s]?.label || s}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
              Cargando conversaciones…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
              {search ? 'Sin resultados' : 'Sin conversaciones aún'}
              <div style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>💬</div>
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ══ MAIN CHAT AREA ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {!activeConvId ? (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem',
            color: '#4b5563',
          }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>
              Selecciona una conversación
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 }}>
              Los mensajes de WhatsApp aparecerán aquí en tiempo real, respondidos automáticamente por el agente de IA.
            </div>
            <div style={{
              marginTop: '1rem', padding: '0.75rem 1.25rem',
              background: 'rgba(37,197,102,0.08)', border: '1px solid rgba(37,197,102,0.2)',
              borderRadius: '12px', fontSize: '0.75rem', color: '#4ade80',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>🟢</span> Webhook activo — escuchando mensajes
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              height: '52px', minHeight: '52px', padding: '0 1.25rem',
              background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                }}>
                  {activeConv?.display_name?.[0]?.toUpperCase() || activeConv?.phone_number?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                    {activeConv?.display_name || formatPhone(activeConv?.phone_number)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    {formatPhone(activeConv?.phone_number)}
                  </div>
                </div>
                {activeConv?.status && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                    borderRadius: '99px',
                    background: STATUS_COLORS[activeConv.status]?.bg,
                    color: STATUS_COLORS[activeConv.status]?.text,
                  }}>
                    {STATUS_COLORS[activeConv.status]?.label}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`https://wa.me/${activeConv?.phone_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir en WhatsApp"
                  style={{
                    padding: '0.3rem 0.7rem', borderRadius: '8px',
                    background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)',
                    color: '#4ade80', fontSize: '0.72rem', fontWeight: 600,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  📱 WhatsApp
                </a>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '1rem 0',
              background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.005) 0px, rgba(255,255,255,0.005) 1px, transparent 1px, transparent 40px)',
            }}>
              {loadingMsgs ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
                  Cargando mensajes…
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
                  Sin mensajes en esta conversación
                </div>
              ) : (
                messages.map(msg => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Info bar */}
            <div style={{
              padding: '0.6rem 1rem',
              background: '#0d1220', borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                🤖 Las respuestas son generadas automáticamente por GPT-4o.
              </span>
              <span style={{
                fontSize: '0.65rem', color: '#4b5563',
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366', display: 'inline-block' }}></span>
                Realtime activo
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

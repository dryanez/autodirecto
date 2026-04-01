'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

// Lazy-load WhatsApp dashboard so it doesn't affect CRM load time
const WhatsAppDashboard = dynamic(() => import('./whatsapp/page'), {
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#6b7280', fontSize: '0.85rem',
      fontFamily: "'Outfit', sans-serif",
    }}>
      Cargando WhatsApp…
    </div>
  ),
  ssr: false,
});

// Lazy-load Instagram Overlay Pro dashboard
const InstagramOverlayDashboard = dynamic(() => import('./instagram/page'), {
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#6b7280', fontSize: '0.85rem',
      fontFamily: "'Outfit', sans-serif",
    }}>
      Cargando Overlay Pro…
    </div>
  ),
  ssr: false,
});

const TABS = [
  { id: 'crm',       label: '🏁 Pipeline',  path: '',          iframe: true  },
  { id: 'funnels',   label: '🚗 Funnels',   path: '/funnels',  iframe: true  },
  { id: 'instagram', label: '📸 Instagram', path: null,        iframe: false },
  { id: 'whatsapp',  label: '💬 WhatsApp',  path: null,        iframe: false },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crm');
  const [whatsappUnread, setWhatsappUnread] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      const raw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('crm_user='))
        ?.split('=')
        .slice(1)
        .join('=');
      if (raw) {
        setUser(JSON.parse(decodeURIComponent(raw)));
      } else {
        router.replace('/admin/login');
      }
    } catch {
      router.replace('/admin/login');
    }
    setLoading(false);
  }, [router]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  // Track WhatsApp unread badge (poll every 30s)
  useEffect(() => {
    let interval;
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const fetchUnread = async () => {
      try {
        const { data } = await sb
          .from('wa_conversations')
          .select('unread_count')
          .gt('unread_count', 0);
        const total = (data || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
        setWhatsappUnread(total);
      } catch {}
    };
    fetchUnread();
    interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0e1a', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#6b7280', fontFamily: "'Outfit', sans-serif",
      }}>
        Cargando CRM…
      </div>
    );
  }

  if (!user) return null;

  const CRM_URL = process.env.NEXT_PUBLIC_SIMPLYAPI_URL || 'http://localhost:8080';

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0e1a', fontFamily: "'Outfit', sans-serif",
    }}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#111827',
        borderBottom: '1px solid rgba(59,130,246,0.2)',
        zIndex: 10, flexShrink: 0,
      }}>
        {/* Row 1: brand + user/logout */}
        <div style={{
          height: '48px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1rem',
        }}>
          <a href="/" style={{
            fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff',
            textDecoration: 'none', letterSpacing: '-0.5px',
          }}>
            Auto<span style={{ color: '#3b82f6' }}>Directo</span>
          </a>

          {/* On desktop also show tabs inline */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.5rem', padding: '0.2rem',
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.2rem 0.75rem',
                    borderRadius: '0.35rem',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeTab === tab.id
                      ? tab.id === 'whatsapp' ? '#25D366'
                      : tab.id === 'instagram' ? '#e1306c'
                      : '#3b82f6'
                      : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#9ca3af',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  {tab.label}
                  {tab.id === 'whatsapp' && whatsappUnread > 0 && activeTab !== 'whatsapp' && (
                    <span style={{
                      background: '#ef4444', color: '#fff',
                      borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800,
                      padding: '0 0.3rem', minWidth: '14px', height: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}>
                      {whatsappUnread > 99 ? '99+' : whatsappUnread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Right: user + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: user?.color || '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!isMobile && (
              <>
                <span style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 500 }}>
                  {user?.name}
                </span>
                <span style={{
                  fontSize: '0.7rem', color: '#6b7280',
                  background: '#1a1f35', padding: '0.15rem 0.45rem', borderRadius: '4px',
                }}>
                  {user?.role}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: isMobile ? '0.35rem 0.6rem' : '0.35rem 0.875rem',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.5rem', color: '#fca5a5',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {isMobile ? '✕' : 'Salir'}
            </button>
          </div>
        </div>

        {/* Row 2 (mobile only): scrollable tabs */}
        {isMobile && (
          <div style={{
            display: 'flex', overflowX: 'auto', gap: '0.25rem',
            padding: '0 0.75rem 0.5rem',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.3rem 0.85rem',
                  borderRadius: '0.35rem',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  background: activeTab === tab.id
                    ? tab.id === 'whatsapp' ? '#25D366'
                    : tab.id === 'instagram' ? '#e1306c'
                    : '#3b82f6'
                    : 'rgba(255,255,255,0.07)',
                  color: activeTab === tab.id ? '#fff' : '#9ca3af',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}
              >
                {tab.label}
                {tab.id === 'whatsapp' && whatsappUnread > 0 && activeTab !== 'whatsapp' && (
                  <span style={{
                    background: '#ef4444', color: '#fff',
                    borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800,
                    padding: '0 0.3rem', minWidth: '14px', height: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {whatsappUnread > 99 ? '99+' : whatsappUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Iframes — both rendered, only active one visible ──────── */}
      {TABS.filter(t => t.iframe).map(tab => (
        <div
          key={tab.id}
          style={{
            flex: 1,
            display: activeTab === tab.id ? 'flex' : 'none',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <iframe
            src={`${CRM_URL}${tab.path}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={tab.label}
            allow="camera; microphone; clipboard-write"
          />
        </div>
      ))}

      {/* ── Instagram Overlay Pro dashboard ───────────────────── */}
      <div style={{
        flex: 1, display: activeTab === 'instagram' ? 'flex' : 'none',
        flexDirection: 'column', overflow: 'hidden', minHeight: 0,
      }}>
        {activeTab === 'instagram' && <InstagramOverlayDashboard />}
      </div>

      {/* ── WhatsApp native dashboard ──────────────────────────── */}
      <div style={{
        flex: 1, display: activeTab === 'whatsapp' ? 'flex' : 'none',
        flexDirection: 'column', overflow: 'hidden', minHeight: 0,
      }}>
        {activeTab === 'whatsapp' && <WhatsAppDashboard />}
      </div>
    </div>
  );
}

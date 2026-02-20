'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const TABS = [
  { id: 'crm',     label: '🗂 CRM',     path: '' },
  { id: 'funnels', label: '🚗 Funnels', path: '/funnels' },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crm');

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
        height: '48px', minHeight: '48px', background: '#111827',
        borderBottom: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 1.25rem', zIndex: 10,
      }}>
        {/* Left: brand + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="/" style={{
            fontSize: '1.1rem', fontWeight: 800, color: '#fff',
            textDecoration: 'none', letterSpacing: '-0.5px',
          }}>
            Auto<span style={{ color: '#3b82f6' }}>Directo</span>
          </a>

          {/* Tab switcher */}
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
                  background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#9ca3af',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: user + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: user?.color || '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 500 }}>
              {user?.name}
            </span>
            <span style={{
              fontSize: '0.7rem', color: '#6b7280',
              background: '#1a1f35', padding: '0.15rem 0.45rem', borderRadius: '4px',
            }}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.35rem 0.875rem',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '0.5rem', color: '#fca5a5',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Iframes — both rendered, only active one visible ──────── */}
      {TABS.map(tab => (
        <iframe
          key={tab.id}
          src={`${CRM_URL}${tab.path}`}
          style={{
            flex: 1, width: '100%', border: 'none',
            display: activeTab === tab.id ? 'block' : 'none',
          }}
          title={tab.label}
          allow="camera; microphone; clipboard-write"
        />
      ))}
    </div>
  );
}

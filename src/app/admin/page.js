'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const iframeRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read user from cookie on mount
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
        minHeight: '100vh',
        background: '#0a0e1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontFamily: "'Outfit', sans-serif",
      }}>
        Cargando CRM…
      </div>
    );
  }

  if (!user) return null;

  const CRM_URL = process.env.NEXT_PUBLIC_SIMPLYAPI_URL || 'http://localhost:8080';

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0e1a',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        height: '48px',
        minHeight: '48px',
        background: '#111827',
        borderBottom: '1px solid rgba(59,130,246,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 10,
      }}>
        {/* Left: brand + back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="/"
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#fff',
              textDecoration: 'none',
              letterSpacing: '-0.5px',
            }}
          >
            Auto<span style={{ color: '#3b82f6' }}>Directo</span>
          </a>
          <span style={{
            background: 'rgba(59,130,246,0.15)',
            color: '#60a5fa',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            CRM Admin
          </span>
        </div>

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: user?.color || '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 500 }}>
              {user?.name}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              background: '#1a1f35',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
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
              borderRadius: '0.5rem',
              color: '#fca5a5',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* CRM iframe — full remaining height */}
      <iframe
        ref={iframeRef}
        src={CRM_URL}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
        }}
        title="AutoDirecto CRM"
        allow="camera; microphone; clipboard-write"
      />
    </div>
  );
}

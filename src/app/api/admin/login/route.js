import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CRM_BASE = process.env.SIMPLYAPI_URL || 'http://localhost:8080';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autodirecto-crm-secret-2026';

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  try {
    // Validate credentials against SimplyAPI
    const res = await fetch(`${CRM_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: data.error || 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Set admin cookie — 8 hour session
    const cookieStore = await cookies();
    cookieStore.set('crm_token', ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    // Also store user info (non-httpOnly so JS can read it for display)
    cookieStore.set('crm_user', JSON.stringify(data.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    console.error('[Admin Login]', err);
    return NextResponse.json(
      { error: 'SimplyAPI no disponible. Asegúrate de que esté corriendo.' },
      { status: 503 }
    );
  }
}

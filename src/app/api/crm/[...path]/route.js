import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// SimplyAPI base URL — set SIMPLYAPI_URL in env, defaults to localhost for dev
const CRM_BASE = process.env.SIMPLYAPI_URL || 'http://localhost:8080';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autodirecto-crm-secret-2026';

// Routes that don't require auth (public-facing endpoints)
const PUBLIC_PATHS = ['api/auth/login'];
// Routes that allow POST without auth (wizard form submissions)
const PUBLIC_POST_PATHS = ['api/consignaciones'];

function isPublic(pathArr, method) {
  const joined = pathArr.join('/');
  if (PUBLIC_PATHS.some((p) => joined.startsWith(p))) return true;
  if (method === 'POST' && PUBLIC_POST_PATHS.some((p) => joined.startsWith(p))) return true;
  return false;
}

async function proxyRequest(request, pathArr, method) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('crm_token')?.value;

  if (!isPublic(pathArr, method) && adminToken !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urlPath = pathArr.join('/');
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const targetUrl = `${CRM_BASE}/${urlPath}${query ? `?${query}` : ''}`;

  const headers = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
    'X-CRM-Proxy': '1',
  };

  const init = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      init.body = await request.text();
    } catch {}
  }

  try {
    const res = await fetch(targetUrl, init);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: { 'Content-Type': contentType },
      });
    }

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: { 'Content-Type': contentType || 'text/plain' },
      });
    }
  } catch (err) {
    console.error('[CRM Proxy] Error:', err);
    return NextResponse.json(
      { error: 'SimplyAPI unreachable', detail: err.message },
      { status: 502 }
    );
  }
}

export async function GET(request, { params }) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(request, { params }) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PATCH(request, { params }) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

export async function PUT(request, { params }) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(request, { params }) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

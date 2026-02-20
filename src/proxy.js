import { NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autodirecto-crm-secret-2026';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes (not /admin/login itself)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('crm_token')?.value;
    if (token !== ADMIN_SECRET) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

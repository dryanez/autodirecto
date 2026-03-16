import { NextResponse } from 'next/server';

// Known aggressive bot user-agent patterns
const BLOCKED_BOTS = [
  'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web',
  'Bytespider', 'PetalBot', 'SemrushBot', 'AhrefsBot', 'MJ12bot',
  'DotBot', 'BLEXBot', 'DataForSeoBot', 'magpie-crawler', 'Amazonbot',
  'meta-externalagent', 'YandexBot', 'baiduspider', 'sogou', 'Scrapy',
  'Python-urllib', 'python-requests', 'Go-http-client', 'Java/',
  'libwww-perl', 'Wget', 'curl/', 'HTTrack', 'WebCopier',
  'TurnitinBot', 'Linguee', 'dissertation', 'heritrix',
];

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const path = request.nextUrl.pathname;

  // Block known aggressive bots immediately (returns 403, no edge compute)
  const uaLower = ua.toLowerCase();
  for (const bot of BLOCKED_BOTS) {
    if (uaLower.includes(bot.toLowerCase())) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Block requests with no user-agent (usually bots/scrapers)
  if (!ua || ua.length < 10) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Block direct access to API routes from outside (except CRM proxy and listings)
  if (path.startsWith('/api/') && !path.startsWith('/api/listings') && !path.startsWith('/api/crm')) {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    // Allow same-origin requests
    if (!origin && !referer) {
      // Could be a direct bot hit
      if (!ua.includes('Vercel') && !ua.includes('node')) {
        return new NextResponse('Not Found', { status: 404 });
      }
    }
  }

  const response = NextResponse.next();

  // Add cache headers for static pages to reduce re-renders
  if (path === '/' || path.startsWith('/catalogo') || path.startsWith('/vehiculo/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }

  return response;
}

export const config = {
  // Run on all routes except static files and images
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff|woff2|css|js)$).*)',
  ],
};

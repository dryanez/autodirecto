import { NextResponse, type NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ AUTODIRECTO EDGE FIREWALL
// Blocks bots, rate-limits IPs, caches aggressively
// ═══════════════════════════════════════════════════════════════════════════════

// Known aggressive bot user-agent patterns (case-insensitive match)
const BLOCKED_BOTS = [
  // AI crawlers
  'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web',
  'Google-Extended', 'Applebot-Extended', 'PerplexityBot', 'cohere-ai',
  // SEO crawlers (burn thousands of requests)
  'SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot', 'BLEXBot',
  'DataForSeoBot', 'Screaming Frog', 'Rogerbot', 'SEOkicks',
  // Asian bots
  'Bytespider', 'PetalBot', 'baiduspider', 'sogou', 'YandexBot',
  // Scraper / generic bots
  'magpie-crawler', 'Amazonbot', 'meta-externalagent',
  'Scrapy', 'Python-urllib', 'python-requests', 'Go-http-client',
  'Java/', 'libwww-perl', 'Wget/', 'curl/', 'HTTrack', 'WebCopier',
  'TurnitinBot', 'Linguee', 'heritrix', 'archive.org_bot',
  'Nuclei', 'Nmap', 'ZmEu', 'masscan', 'zgrab',
  // Misc
  'FacebookBot', 'Twitterbot/0', 'Mail.RU_Bot', 'Applebot',
];

// ── Simple in-memory rate limiter (per edge instance) ──
// Not perfect (each Vercel edge instance has its own map) but catches
// single-IP floods which is 90% of the problem.
const ipHits: Map<string, { windowStart: number; count: number }> = new Map();
const RATE_WINDOW_MS = 60_000;   // 1 minute window
const RATE_LIMIT = 60;           // max 60 requests per minute per IP (generous for humans)

function isRateLimited(ip: string) {
  const now = Date.now();
  const record = ipHits.get(ip);

  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT) {
    return true;
  }
  return false;
}

// Cleanup stale entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  ipHits.forEach((record, ip) => {
    if (now - record.windowStart > RATE_WINDOW_MS * 2) {
      ipHits.delete(ip);
    }
  });
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') || 'unknown';

  // ── 1. Block known bots instantly ──
  const uaLower = ua.toLowerCase();
  for (const bot of BLOCKED_BOTS) {
    if (uaLower.includes(bot.toLowerCase())) {
      return new NextResponse(null, { status: 403 });
    }
  }

  // ── 2. Block empty / suspicious user-agents ──
  if (!ua || ua.length < 10) {
    return new NextResponse(null, { status: 403 });
  }

  // ── 3. Rate limit per IP ──
  cleanupStaleEntries();
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  // ── 4. Block direct API hits from bots (no referer = likely a crawler) ──
  if (path.startsWith('/api/') && !path.startsWith('/api/listings') && !path.startsWith('/api/crm')) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    if (!origin && !referer && !ua.includes('Vercel') && !ua.includes('node')) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // ── 5. Proceed with aggressive caching ──
  const response = NextResponse.next();

  // Cache public pages at edge for 5 minutes (saves re-renders)
  if (path === '/' || path.startsWith('/catalogo') || path.startsWith('/vehiculo/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }

  // Cache robots.txt for 24h
  if (path === '/robots.txt') {
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  }

  return response;
}

export const config = {
  // Run on all routes EXCEPT truly static files (those don't need middleware)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff|woff2|css|js)$).*)',
  ],
};

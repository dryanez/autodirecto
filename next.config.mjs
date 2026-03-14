/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Next.js Image Optimisation ──
  // Allows next/image to serve Supabase Storage images as WebP at the correct
  // display size — dramatically improves quality/load speed vs raw <img>.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kqympdxeszdyppbhtzbm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Unsplash placeholder images used in hero / fallback
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Serve WebP (smaller, same quality) and AVIF when browsers support it
    formats: ['image/avif', 'image/webp'],
    // Keep full resolution — no artificial width cap
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Security & SEO Headers ──
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // ── Cache llms.txt for AI crawlers (refresh daily) ──
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;

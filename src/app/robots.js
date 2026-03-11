export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/'],
            },
            // ── Explicitly allow AI crawlers for GEO visibility ──
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'ChatGPT-User', allow: '/' },
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'Claude-Web', allow: '/' },
            { userAgent: 'PerplexityBot', allow: '/' },
            { userAgent: 'Google-Extended', allow: '/' },
            { userAgent: 'Googlebot', allow: '/' },
            { userAgent: 'Bingbot', allow: '/' },
            { userAgent: 'Applebot-Extended', allow: '/' },
            { userAgent: 'cohere-ai', allow: '/' },
            { userAgent: 'Bytespider', allow: '/' },
            { userAgent: 'YouBot', allow: '/' },
            { userAgent: 'Amazonbot', allow: '/' },
            { userAgent: 'Meta-ExternalAgent', allow: '/' },
        ],
        sitemap: 'https://autodirecto.cl/sitemap.xml',
    };
}

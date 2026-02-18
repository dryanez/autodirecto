export default function sitemap() {
    const baseUrl = 'https://autodirecto.cl';

    const staticPages = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
        { url: `${baseUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/consignacion`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ];

    // Vehicle detail pages
    const vehiclePages = Array.from({ length: 16 }, (_, i) => ({
        url: `${baseUrl}/catalogo/${i + 1}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [...staticPages, ...vehiclePages];
}

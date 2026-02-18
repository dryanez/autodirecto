import Link from 'next/link';

export const metadata = {
    title: 'Blog — Consejos y Noticias Automotrices',
    description: 'Lee nuestras guías, consejos y noticias sobre el mundo automotriz en Chile. Mantén tu auto en las mejores condiciones y toma decisiones informadas.',
};

const blogPosts = [
    {
        id: 1,
        title: '¿Cuánto Vale Tu Auto? Guía Completa para Tasarlo en Chile 2026',
        excerpt: 'Aprende a determinar el valor real de tu vehículo con nuestra guía paso a paso. Factores clave, herramientas y consejos de expertos.',
        icon: '💰',
        date: '15 Feb 2026',
        category: 'Guías',
    },
    {
        id: 2,
        title: '5 Errores que Cometes al Vender tu Auto (y Cómo Evitarlos)',
        excerpt: 'Los errores más comunes que bajan el valor de tu auto o alargan el proceso de venta. Tips profesionales para vender rápido y al mejor precio.',
        icon: '⚠️',
        date: '10 Feb 2026',
        category: 'Consejos',
    },
    {
        id: 3,
        title: 'Consignación vs Venta Directa: ¿Qué Conviene Más en Chile?',
        excerpt: 'Analizamos las ventajas y desventajas de cada opción. Descubre cuál es el mejor camino para vender tu vehículo según tu situación.',
        icon: '📊',
        date: '5 Feb 2026',
        category: 'Análisis',
    },
    {
        id: 4,
        title: 'Los SUV Más Vendidos en Chile: Ranking 2026',
        excerpt: 'Descubre cuáles son los SUV que dominan el mercado chileno este año. Comparativa de precios, equipamiento y rendimiento.',
        icon: '🏆',
        date: '1 Feb 2026',
        category: 'Rankings',
    },
    {
        id: 5,
        title: 'Cómo Hacer la Transferencia de un Vehículo en Chile: Paso a Paso',
        excerpt: 'Todo lo que necesitas saber sobre la transferencia de dominio en Chile. Documentos, costos, plazos y dónde realizarla.',
        icon: '📋',
        date: '25 Ene 2026',
        category: 'Guías',
    },
    {
        id: 6,
        title: 'Autos Eléctricos e Híbridos en Chile: ¿Vale la Pena en 2026?',
        excerpt: 'Analizamos el mercado de vehículos eléctricos e híbridos en Chile. Costos de mantención, carga, autonomía y beneficios tributarios.',
        icon: '⚡',
        date: '20 Ene 2026',
        category: 'Tendencias',
    },
];

export default function BlogPage() {
    return (
        <>
            <div className="page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        📰 Blog
                    </span>
                    <h1>
                        Noticias y <span className="gradient-text">Consejos</span>
                    </h1>
                    <p>Guías, tendencias y todo lo que necesitas saber del mundo automotriz en Chile.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="blog-grid">
                        {blogPosts.map(post => (
                            <article key={post.id} className="blog-card">
                                <div className="blog-card-image">
                                    {post.icon}
                                </div>
                                <div className="blog-card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                        <span className="blog-card-date">{post.date}</span>
                                        <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>{post.category}</span>
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p style={{ marginTop: 'var(--space-sm)' }}>{post.excerpt}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter CTA */}
                    <div className="cta-banner" style={{ marginTop: 'var(--space-4xl)' }}>
                        <h2>📬 Suscríbete a Nuestro Newsletter</h2>
                        <p>Recibe las mejores guías, consejos y ofertas directamente en tu email.</p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                style={{
                                    flex: 1,
                                    padding: '0.875rem 1.25rem',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    fontSize: '1rem',
                                    background: 'rgba(255,255,255,0.9)',
                                    color: '#1a1f35',
                                }}
                            />
                            <button className="btn" style={{ background: 'var(--color-bg-primary)', color: 'white' }}>
                                Suscribir
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

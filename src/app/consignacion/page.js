import Link from 'next/link';

export const metadata = {
    title: 'Consignación — Vende tu Auto Sin Complicaciones',
    description: 'Cotiza y vende tu auto con Auto Directo. Ingresa tu patente y obtén una cotización instantánea. Servicio 100% online desde Viña del Mar. Comisión transparente del 3.9% + IVA.',
    alternates: {
        canonical: 'https://autodirecto.cl/consignacion',
    },
    openGraph: {
        title: 'Consignación de Vehículos | Auto Directo',
        description: 'Vende tu auto sin complicaciones. Nosotros publicamos, negociamos y gestionamos todo. Tiempo promedio: 14 días.',
        url: 'https://autodirecto.cl/consignacion',
    },
};

// JSON-LD Service schema for consignación
const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Consignación de Vehículos',
    description: 'Servicio de consignación de vehículos 100% online. Publicamos, negociamos y gestionamos la venta completa de tu auto. Comisión transparente del 3.9% + IVA. Tiempo promedio de venta: 14 días.',
    provider: {
        '@type': 'AutoDealer',
        '@id': 'https://autodirecto.cl/#organization',
        name: 'Auto Directo',
    },
    serviceType: 'Consignación de vehículos',
    areaServed: { '@type': 'Country', name: 'Chile' },
    url: 'https://autodirecto.cl/consignacion',
    offers: {
        '@type': 'Offer',
        description: 'Comisión del 3.9% + IVA sobre el precio de venta',
        priceCurrency: 'CLP',
    },
    hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios incluidos',
        itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Publicación profesional en múltiples plataformas' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gestión de interesados y negociación' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Transferencia legal en notaría' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Inspección vehicular certificada' } },
        ],
    },
};

export default function ConsignacionPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
            />
            {/* Hero */}
            <div className="consignacion-hero">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        💰 Servicio de Consignación
                    </span>
                    <h1 className="consignacion-title">
                        Vende tu Auto <span className="gradient-text">Sin Complicaciones</span>
                    </h1>
                    <p className="consignacion-subtitle">
                        Nosotros nos encargamos de todo: publicación, negociación, documentación y transferencia.
                        Tú solo recibes tu dinero. 100% online.
                    </p>
                </div>
            </div>

            {/* Benefits */}
            <section className="section">
                <div className="container">
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <div className="benefit-icon">📸</div>
                            <h3>Publicación Profesional</h3>
                            <p>Creamos publicaciones atractivas con fotos profesionales en todas las plataformas principales.</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">📋</div>
                            <h3>Gestión Completa</h3>
                            <p>Manejamos todas las consultas, coordinamos visitas virtuales y negociamos con los interesados.</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">🏦</div>
                            <h3>Financiamiento</h3>
                            <p>Trabajamos con instituciones financieras para que los compradores puedan acceder a crédito automotriz.</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">📝</div>
                            <h3>Transferencia Legal</h3>
                            <p>Nos encargamos de toda la documentación legal y la transferencia en notaría.</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">⚡</div>
                            <h3>Venta Rápida</h3>
                            <p>Tiempo promedio de venta de 14 días. Nuestro alcance digital maximiza la exposición de tu auto.</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">🔒</div>
                            <h3>Sin Compromiso</h3>
                            <p>Puedes retirar tu vehículo de la consignación en cualquier momento sin costos adicionales.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <h2 className="section-title">
                        Proceso <span className="gradient-text">Simple</span>
                    </h2>
                    <p className="section-subtitle">Solo 3 pasos y tu auto estará publicado.</p>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Cotiza tu Auto</h3>
                            <p>Ingresa tu patente y obtén una cotización instantánea con nuestro sistema inteligente.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>Evaluación Gratuita</h3>
                            <p>Nuestro equipo evalúa tu auto y te contacta con una propuesta de precio de venta.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>Nosotros Vendemos</h3>
                            <p>Publicamos, gestionamos y cerramos la venta. Tú recibes tu dinero de forma segura.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Embedded Cotización App */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title">
                        Cotiza tu Auto <span className="gradient-text">Gratis</span>
                    </h2>
                    <p className="section-subtitle">
                        Ingresa tu patente y obtén una cotización instantánea. Sin compromiso.
                    </p>

                    <div className="cotizacion-embed">
                        <iframe
                            src="https://mrcar-cotizacion.vercel.app"
                            title="Cotizador de Vehículos — Auto Directo"
                            width="100%"
                            style={{
                                border: 'none',
                                borderRadius: 'var(--radius-xl)',
                                background: 'var(--color-bg-card)',
                                minHeight: '700px',
                                height: '80vh',
                                maxHeight: '900px',
                            }}
                            allow="clipboard-write"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}


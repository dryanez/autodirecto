'use client';

import { useState } from 'react';
import Link from 'next/link';
import { vehicles } from '@/lib/mockData';
import { use } from 'react';

export default function VehicleDetailPage({ params }) {
    const resolvedParams = use(params);
    const vehicle = vehicles.find(v => v.id === parseInt(resolvedParams.id));
    const [activeImage, setActiveImage] = useState(0);

    if (!vehicle) {
        return (
            <div className="container detail-page" style={{ textAlign: 'center' }}>
                <h1>Vehículo no encontrado</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                    El vehículo que buscas no existe o ya fue vendido.
                </p>
                <Link href="/catalogo" className="btn btn-primary">
                    Volver al Catálogo
                </Link>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatMileage = (km) => {
        return new Intl.NumberFormat('es-CL').format(km);
    };

    const relatedVehicles = vehicles
        .filter(v => v.id !== vehicle.id)
        .slice(0, 3);

    const whatsappMessage = encodeURIComponent(
        `Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year} publicado en Auto Directo. ¿Podrían darme más información?`
    );

    // JSON-LD for vehicle
    const vehicleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        brand: { '@type': 'Brand', name: vehicle.brand },
        model: vehicle.model,
        vehicleModelDate: vehicle.year.toString(),
        mileageFromOdometer: {
            '@type': 'QuantitativeValue',
            value: vehicle.mileage_km,
            unitCode: 'KMT',
        },
        fuelType: vehicle.fuel_type,
        vehicleTransmission: vehicle.transmission,
        color: vehicle.color,
        offers: {
            '@type': 'Offer',
            price: vehicle.price,
            priceCurrency: 'CLP',
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'AutoDealer',
                name: 'Auto Directo',
            },
        },
        image: vehicle.image_urls[0],
        description: vehicle.description,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
            />

            <div className="container detail-page">
                {/* Breadcrumb */}
                <nav style={{ marginBottom: 'var(--space-xl)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Inicio</Link>
                    {' / '}
                    <Link href="/catalogo" style={{ color: 'var(--color-text-muted)' }}>Catálogo</Link>
                    {' / '}
                    <span style={{ color: 'var(--color-text-primary)' }}>{vehicle.brand} {vehicle.model}</span>
                </nav>

                <div className="detail-grid">
                    {/* Gallery */}
                    <div>
                        <div className="detail-gallery">
                            <img
                                src={vehicle.image_urls[activeImage]}
                                alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                            />
                            <div className="detail-gallery-thumbs">
                                {vehicle.image_urls.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Vista ${i + 1}`}
                                        className={activeImage === i ? 'active' : ''}
                                        onClick={() => setActiveImage(i)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="detail-description">
                            <h2>Descripción</h2>
                            <p>{vehicle.description}</p>
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="detail-info">
                        <div className="detail-info-card">
                            <span className="badge badge-success" style={{ marginBottom: 'var(--space-md)' }}>
                                ✓ Disponible
                            </span>
                            <div className="detail-price">{formatPrice(vehicle.price)}</div>
                            <h1 className="detail-title">{vehicle.brand} {vehicle.model}</h1>
                            <p className="detail-subtitle">{vehicle.year} · {vehicle.color}</p>

                            <div className="detail-specs-grid">
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Kilometraje</span>
                                    <span className="detail-spec-value">{formatMileage(vehicle.mileage_km)} km</span>
                                </div>
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Combustible</span>
                                    <span className="detail-spec-value">{vehicle.fuel_type}</span>
                                </div>
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Transmisión</span>
                                    <span className="detail-spec-value">{vehicle.transmission}</span>
                                </div>
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Color</span>
                                    <span className="detail-spec-value">{vehicle.color}</span>
                                </div>
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Año</span>
                                    <span className="detail-spec-value">{vehicle.year}</span>
                                </div>
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Estado</span>
                                    <span className="detail-spec-value" style={{ color: 'var(--color-success)' }}>Disponible</span>
                                </div>
                            </div>

                            <div className="detail-actions">
                                <a
                                    href={`https://wa.me/56912345678?text=${whatsappMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-whatsapp"
                                    style={{ width: '100%' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.703-1.228A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.3 0-4.438-.763-6.152-2.048l-.429-.332-3.29.859.893-3.26-.365-.447A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                                    </svg>
                                    Consultar por WhatsApp
                                </a>
                                <Link href="/contacto" className="btn btn-secondary" style={{ width: '100%' }}>
                                    📧 Enviar Consulta
                                </Link>
                                <a href="tel:+56912345678" className="btn btn-secondary" style={{ width: '100%' }}>
                                    📞 Llamar Ahora
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Vehicles */}
                <section style={{ marginTop: 'var(--space-4xl)' }}>
                    <h2 className="section-title" style={{ textAlign: 'left', fontSize: '1.75rem' }}>
                        También te puede interesar
                    </h2>
                    <div className="vehicles-grid" style={{ marginTop: 'var(--space-xl)' }}>
                        {relatedVehicles.map(v => (
                            <div key={v.id}>
                                <Link href={`/catalogo/${v.id}`} className="vehicle-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    <div className="vehicle-card-image">
                                        <img src={v.image_urls[0]} alt={`${v.brand} ${v.model}`} loading="lazy" />
                                    </div>
                                    <div className="vehicle-card-body">
                                        <h3 className="vehicle-card-title">{v.brand} {v.model}</h3>
                                        <p className="vehicle-card-year">{v.year}</p>
                                        <div className="vehicle-card-footer">
                                            <div className="vehicle-card-price">
                                                {formatPrice(v.price)}
                                            </div>
                                            <span className="vehicle-card-link">Ver más →</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

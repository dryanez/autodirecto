'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { use } from 'react';

export default function VehicleDetailPage({ params }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const thumbsRef = useRef(null);

    const scrollThumbs = (dir) => {
        if (!thumbsRef.current) return;
        thumbsRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' });
    };

    // Credit simulator state
    const [creditOpen, setCreditOpen] = useState(false);
    const [downPct, setDownPct] = useState(20);
    const [months, setMonths] = useState(48);
    const [rate, setRate] = useState(0.89); // monthly % typical Chile

    const calcCredit = (price) => {
        if (!price) return null;
        const down = Math.round(price * downPct / 100);
        const financed = price - down;
        const r = rate / 100;
        const monthly = r === 0 ? financed / months
            : Math.round(financed * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
        return { down, financed, monthly };
    };

    useEffect(() => {
        const id = resolvedParams.id;
        // Fetch the specific vehicle
        fetch(`/api/listings?id=${id}`)
            .then(r => r.json())
            .then(data => {
                if (data && !data.error) setVehicle(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Fetch all for related section
        fetch('/api/listings')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRelated(data.filter(v => String(v.id) !== String(id)).slice(0, 3));
                }
            })
            .catch(() => {});
    }, [resolvedParams.id]);

    if (loading) {
        return (
            <div className="container detail-page" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>⏳</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Cargando vehículo...</p>
            </div>
        );
    }

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

    const relatedVehicles = related;

    const whatsappMessage = encodeURIComponent(
        `Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year} publicado en Auto Directo. ¿Podrían darme más información?`
    );

    // Build CSS style from per-photo edits.
    // Must match EXACTLY the transform formula used in the CRM editor (index.html):
    //   perspective(800px) scale(zoom) translate(panX/zoom px, panY/zoom px) rotateX(skewV) rotateY(skewH)
    // panX/panY are stored in px (mouse drag pixels), NOT percentages.
    // thumbOnly=true → only colour filters, no zoom/pan (thumbnails have no overflow clip)
    const getEditStyle = (idx, thumbOnly = false) => {
        const edits = vehicle.image_edits?.[idx];
        if (!edits) return {};
        const zoom = edits.zoom ?? 1;
        const panX = edits.panX ?? 0;
        const panY = edits.panY ?? 0;
        const brightness = edits.brightness ?? 100;
        const contrast = edits.contrast ?? 100;
        const saturate = edits.saturate ?? 100;
        const skewV = edits.skewV ?? 0;
        const skewH = edits.skewH ?? 0;

        const isDefault = zoom === 1 && panX === 0 && panY === 0 &&
            brightness === 100 && contrast === 100 && saturate === 100 &&
            skewV === 0 && skewH === 0;
        if (isDefault) return {};

        const style = {};

        if (!thumbOnly) {
            style.transform = `perspective(800px) scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px) rotateX(${skewV}deg) rotateY(${skewH}deg)`;
        }

        if (brightness !== 100 || contrast !== 100 || saturate !== 100) {
            style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
        }
        return style;
    };

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
                            <div className="detail-gallery-main">
                                {/* Plain <img> — avoids next/image fill stale-image flash and overlay issues.
                                    The edit transform is applied directly; no intermediate loading state. */}
                                <img
                                    key={activeImage}
                                    src={vehicle.image_urls[activeImage]}
                                    alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                                    style={getEditStyle(activeImage)}
                                />
                                {vehicle.image_urls.length > 1 && (
                                    <>
                                        <button
                                            className="main-arrow left"
                                            onClick={() => setActiveImage(i => (i - 1 + vehicle.image_urls.length) % vehicle.image_urls.length)}
                                            aria-label="Imagen anterior"
                                        >‹</button>
                                        <button
                                            className="main-arrow right"
                                            onClick={() => setActiveImage(i => (i + 1) % vehicle.image_urls.length)}
                                            aria-label="Imagen siguiente"
                                        >›</button>
                                        <span className="main-image-counter">
                                            {activeImage + 1} / {vehicle.image_urls.length}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="detail-gallery-thumbs-wrapper">
                                {vehicle.image_urls.length > 6 && (
                                    <button className="thumb-arrow left" onClick={() => scrollThumbs(-1)} aria-label="Anterior">‹</button>
                                )}
                                <div className="detail-gallery-thumbs" ref={thumbsRef}>
                                    {vehicle.image_urls.map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Vista ${i + 1}`}
                                            className={`detail-gallery-thumb-img${activeImage === i ? ' active' : ''}`}
                                            onClick={() => setActiveImage(i)}
                                            style={getEditStyle(i, true)}
                                        />
                                    ))}
                                </div>
                                {vehicle.image_urls.length > 6 && (
                                    <button className="thumb-arrow right" onClick={() => scrollThumbs(1)} aria-label="Siguiente">›</button>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="detail-description">
                            <h2>Descripción</h2>
                            <p>{vehicle.description}</p>
                        </div>

                        {/* Features / Equipment */}
                        {vehicle.features && vehicle.features.length > 0 && (
                            <div className="detail-description" style={{ marginTop: 'var(--space-xl)' }}>
                                <h2>Equipamiento técnico</h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '10px',
                                    marginTop: 'var(--space-md)',
                                }}>
                                    {vehicle.features.map((feat, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: 'var(--color-surface-2, #1e293b)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '10px',
                                            padding: '10px 14px',
                                            fontSize: '0.9rem',
                                            color: 'var(--color-text-primary)',
                                        }}>
                                            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                                                {feat.split(' ')[0]}
                                            </span>
                                            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                                {feat.split(' ').slice(1).join(' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                {vehicle.body_type && (
                                    <div className="detail-spec-item">
                                        <span className="detail-spec-label">Carrocería</span>
                                        <span className="detail-spec-value">{vehicle.body_type}</span>
                                    </div>
                                )}
                                {vehicle.doors && (
                                    <div className="detail-spec-item">
                                        <span className="detail-spec-label">Puertas</span>
                                        <span className="detail-spec-value">{vehicle.doors}</span>
                                    </div>
                                )}
                                <div className="detail-spec-item">
                                    <span className="detail-spec-label">Estado</span>
                                    <span className="detail-spec-value" style={{ color: 'var(--color-success)' }}>Disponible</span>
                                </div>
                            </div>

                            <div className="detail-actions">
                                {/* Credit Simulator */}
                                <div style={{ marginBottom: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <button
                                        onClick={() => setCreditOpen(o => !o)}
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--color-surface-2, #1e293b)', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}
                                    >
                                        <span>🧮 Simular Crédito</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{creditOpen ? '▲ Cerrar' : '▼ Ver cuotas'}</span>
                                    </button>
                                    {creditOpen && (() => {
                                        const cr = calcCredit(vehicle.price);
                                        return cr ? (
                                            <div style={{ padding: '16px', background: 'var(--color-surface, #0f172a)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Pie: {downPct}%</label>
                                                        <input type="range" min={10} max={50} step={5} value={downPct}
                                                            onChange={e => setDownPct(Number(e.target.value))}
                                                            style={{ width: '100%', accentColor: 'var(--color-primary, #3b82f6)' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Plazo: {months} meses</label>
                                                        <input type="range" min={12} max={72} step={12} value={months}
                                                            onChange={e => setMonths(Number(e.target.value))}
                                                            style={{ width: '100%', accentColor: 'var(--color-primary, #3b82f6)' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                                                    <div style={{ background: 'var(--color-surface-2, #1e293b)', borderRadius: 8, padding: '10px 6px' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>PIE</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatPrice(cr.down)}</div>
                                                    </div>
                                                    <div style={{ background: 'var(--color-surface-2, #1e293b)', borderRadius: 8, padding: '10px 6px' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>FINANCIADO</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatPrice(cr.financed)}</div>
                                                    </div>
                                                    <div style={{ background: 'var(--color-primary, #3b82f6)', borderRadius: 8, padding: '10px 6px' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>CUOTA/MES</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{formatPrice(cr.monthly)}</div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
                                                    Simulación referencial. Tasa {rate}% mensual. Valores reales sujetos a evaluación crediticia.
                                                </p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                <a
                                    href={`https://wa.me/56940441470?text=${whatsappMessage}`}
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
                                <a href="tel:+56940441470" className="btn btn-secondary" style={{ width: '100%' }}>
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
                                        {(() => {
                                            const edits = v.image_edits?.[0];
                                            const imgStyle = { objectFit: 'cover' };
                                            if (edits) {
                                                const z = edits.zoom ?? 1, px = edits.panX ?? 0, py = edits.panY ?? 0;
                                                const b = edits.brightness ?? 100, c = edits.contrast ?? 100, s = edits.saturate ?? 100;
                                                const sv = edits.skewV ?? 0, sh = edits.skewH ?? 0;
                                                if (!(z===1&&px===0&&py===0&&b===100&&c===100&&s===100&&sv===0&&sh===0)) {
                                                    imgStyle.transform = `perspective(800px) scale(${z}) translate(${px / z}px, ${py / z}px) rotateX(${sv}deg) rotateY(${sh}deg)`;
                                                    imgStyle.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
                                                }
                                            }
                                            return (
                                                <Image
                                                    src={v.image_urls[0]}
                                                    alt={`${v.brand} ${v.model}`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 400px"
                                                    style={imgStyle}
                                                />
                                            );
                                        })()}
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

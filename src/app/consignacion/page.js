'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConsignacionPage() {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        brand: '', model: '', year: '', mileage: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production, this would send to Supabase
        console.log('Form submitted:', formData);
        setSubmitted(true);
    };

    return (
        <>
            {/* Hero */}
            <div className="consignacion-hero">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        💰 Servicio de Consignación
                    </span>
                    <h1 style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
                        Vende tu Auto <span className="gradient-text">Sin Complicaciones</span>
                    </h1>
                    <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
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
                            <h3>Envía tus Datos</h3>
                            <p>Completa el formulario con la información de tu vehículo. Es rápido y sin compromiso.</p>
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

            {/* Form */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title">
                        Cotiza tu Auto <span className="gradient-text">Gratis</span>
                    </h2>
                    <p className="section-subtitle">
                        Completa el formulario y te contactaremos en menos de 24 horas.
                    </p>

                    {submitted ? (
                        <div className="consignacion-form-section" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>✅</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>¡Solicitud Enviada!</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                                Nuestro equipo revisará la información de tu vehículo y te contactará
                                en las próximas 24 horas por WhatsApp o email.
                            </p>
                            <Link href="/" className="btn btn-primary">Volver al Inicio</Link>
                        </div>
                    ) : (
                        <form className="consignacion-form-section" onSubmit={handleSubmit}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xl)' }}>
                                📋 Información de tu Vehículo
                            </h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label htmlFor="brand">Marca *</label>
                                    <input id="brand" name="brand" className="input-field" placeholder="Ej: Toyota" required value={formData.brand} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="model">Modelo *</label>
                                    <input id="model" name="model" className="input-field" placeholder="Ej: Corolla Cross" required value={formData.model} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="year">Año *</label>
                                    <input id="year" name="year" type="number" className="input-field" placeholder="Ej: 2023" required value={formData.year} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="mileage">Kilometraje</label>
                                    <input id="mileage" name="mileage" type="number" className="input-field" placeholder="Ej: 25000" value={formData.mileage} onChange={handleChange} />
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', margin: 'var(--space-2xl) 0 var(--space-xl)' }}>
                                👤 Tus Datos de Contacto
                            </h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label htmlFor="name">Nombre completo *</label>
                                    <input id="name" name="name" className="input-field" placeholder="Tu nombre" required value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="phone">Teléfono / WhatsApp *</label>
                                    <input id="phone" name="phone" type="tel" className="input-field" placeholder="+56 9 XXXX XXXX" required value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="input-group form-full">
                                    <label htmlFor="email">Email</label>
                                    <input id="email" name="email" type="email" className="input-field" placeholder="tu@email.com" value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="input-group form-full">
                                    <label htmlFor="message">Comentarios adicionales</label>
                                    <textarea id="message" name="message" className="input-field" placeholder="Cualquier detalle adicional sobre tu vehículo..." value={formData.message} onChange={handleChange} />
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                                <button type="submit" className="btn btn-primary btn-lg">
                                    Enviar Solicitud de Consignación →
                                </button>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
                                    Sin compromiso. Te contactaremos en menos de 24 horas.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </>
    );
}

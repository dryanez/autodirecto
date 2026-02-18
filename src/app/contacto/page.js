'use client';

import { useState } from 'react';

export default function ContactoPage() {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
    };

    return (
        <>
            <div className="page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        📞 Contacto
                    </span>
                    <h1>
                        <span className="gradient-text">Hablemos</span>
                    </h1>
                    <p>Estamos aquí para ayudarte. Contáctanos por el canal que prefieras.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Info */}
                        <div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xl)' }}>
                                Información de Contacto
                            </h2>
                            <div className="contact-info-list">
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">💬</div>
                                    <div>
                                        <h3>WhatsApp</h3>
                                        <p>
                                            <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer">
                                                +56 9 1234 5678
                                            </a>
                                        </p>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                            Respuesta en menos de 2 horas
                                        </p>
                                    </div>
                                </div>
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">📧</div>
                                    <div>
                                        <h3>Email</h3>
                                        <p>
                                            <a href="mailto:contacto@autodirecto.cl">contacto@autodirecto.cl</a>
                                        </p>
                                    </div>
                                </div>
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">📞</div>
                                    <div>
                                        <h3>Teléfono</h3>
                                        <p>
                                            <a href="tel:+56912345678">+56 9 1234 5678</a>
                                        </p>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                            Lunes a Viernes, 9:00 - 18:00
                                        </p>
                                    </div>
                                </div>
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">📍</div>
                                    <div>
                                        <h3>Oficina Administrativa</h3>
                                        <p>Av. Bosques de Montemar 30, Of. 316</p>
                                        <p>Viña del Mar, Chile</p>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                            * Atención 100% online, no requiere visita presencial
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="contact-map">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.3!2d-71.55!3d-33.015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDAwJzU0LjAiUyA3McKwMzMnMDAuMCJX!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl"
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Ubicación Auto Directo"
                                />
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <div className="contact-form-card">
                                <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xl)' }}>
                                    Envíanos un Mensaje
                                </h2>

                                {submitted ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
                                        <h3>¡Mensaje Enviado!</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
                                            Te responderemos lo antes posible.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-grid">
                                            <div className="input-group form-full">
                                                <label htmlFor="name">Nombre completo *</label>
                                                <input id="name" name="name" className="input-field" placeholder="Tu nombre" required value={formData.name} onChange={handleChange} />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="email">Email *</label>
                                                <input id="email" name="email" type="email" className="input-field" placeholder="tu@email.com" required value={formData.email} onChange={handleChange} />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="phone">Teléfono</label>
                                                <input id="phone" name="phone" type="tel" className="input-field" placeholder="+56 9 XXXX XXXX" value={formData.phone} onChange={handleChange} />
                                            </div>
                                            <div className="input-group form-full">
                                                <label htmlFor="message">Mensaje *</label>
                                                <textarea id="message" name="message" className="input-field" placeholder="¿En qué podemos ayudarte?" required value={formData.message} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 'var(--space-xl)' }}>
                                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                                Enviar Mensaje →
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <a
                                    href="https://wa.me/56912345678?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Auto%20Directo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-whatsapp"
                                    style={{ width: '100%' }}
                                >
                                    💬 Chat por WhatsApp
                                </a>
                                <a href="tel:+56912345678" className="btn btn-secondary" style={{ width: '100%' }}>
                                    📞 Llamar Ahora
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

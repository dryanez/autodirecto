'use client';

import { useState } from 'react';
import Link from 'next/link';
import { faqItems } from '@/lib/mockData';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // JSON-LD for FAQ
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            <div className="page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        ❓ FAQ
                    </span>
                    <h1>
                        Preguntas <span className="gradient-text">Frecuentes</span>
                    </h1>
                    <p>Resolvemos tus dudas más comunes sobre nuestros servicios.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="faq-list">
                        {faqItems.map((item, index) => (
                            <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
                                <button className="faq-question" onClick={() => toggle(index)}>
                                    {item.question}
                                    <span className="faq-icon">+</span>
                                </button>
                                {openIndex === index && (
                                    <div className="faq-answer">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* CTA after FAQ */}
                    <div style={{ textAlign: 'center', marginTop: 'var(--space-4xl)' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
                            ¿Tienes otra pregunta?
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                            Nuestro equipo está listo para ayudarte.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a
                                href="https://wa.me/56912345678?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20Auto%20Directo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-whatsapp"
                            >
                                💬 Pregunta por WhatsApp
                            </a>
                            <Link href="/contacto" className="btn btn-secondary">
                                📧 Enviar un Mensaje
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

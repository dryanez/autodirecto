import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div>
                        <div className="footer-brand">
                            Auto<span>Directo</span>
                        </div>
                        <p className="footer-desc">
                            La plataforma más moderna de Chile para comprar y vender autos 100% online.
                            Sin complicaciones, con total transparencia y asesoría personalizada.
                        </p>
                        <div className="footer-social">
                            <a href="https://instagram.com/autodirecto" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a href="https://facebook.com/autodirecto" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                </svg>
                            </a>
                            <a href="https://tiktok.com/@autodirecto" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.4a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.18V11.3a4.85 4.85 0 01-2-4.61" />
                                </svg>
                            </a>
                            <a href="https://youtube.com/@autodirecto" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Column */}
                    <div>
                        <h4 className="footer-heading">Navegación</h4>
                        <ul className="footer-links">
                            <li><Link href="/catalogo">Catálogo de Autos</Link></li>
                            <li><Link href="/consignacion">Vende tu Auto</Link></li>
                            <li><Link href="/nosotros">Quiénes Somos</Link></li>
                            <li><Link href="/faq">Preguntas Frecuentes</Link></li>
                            <li><Link href="/blog">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Services Column */}
                    <div>
                        <h4 className="footer-heading">Servicios</h4>
                        <ul className="footer-links">
                            <li><Link href="/consignacion">Consignación</Link></li>
                            <li><Link href="/catalogo">Compra Online</Link></li>
                            <li><Link href="/contacto">Asesoría Gratuita</Link></li>
                            <li><Link href="/faq">Financiamiento</Link></li>
                            <li><Link href="/contacto">Transferencia Digital</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="footer-heading">Contacto</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="mailto:contacto@autodirecto.cl">
                                    📧 contacto@autodirecto.cl
                                </a>
                            </li>
                            <li>
                                <a href="tel:+56912345678">
                                    📞 +56 9 1234 5678
                                </a>
                            </li>
                            <li>
                                <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer">
                                    💬 WhatsApp
                                </a>
                            </li>
                            <li style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                                📍 Av. Bosques de Montemar 30, Of. 316, Viña del Mar
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {currentYear} Auto Directo — Wiackowska Group Spa. Todos los derechos reservados.</p>
                    <p>Viña del Mar, Chile 🇨🇱</p>
                </div>
            </div>
        </footer>
    );
}

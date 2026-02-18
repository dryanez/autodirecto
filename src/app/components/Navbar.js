'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobile = () => setMobileOpen(!mobileOpen);

    return (
        <>
            <nav className={`navbar ${scrolled ? 'solid' : 'solid'}`}>
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo">
                        Auto<span>Directo</span>
                    </Link>

                    <ul className="navbar-links">
                        <li><Link href="/catalogo">Catálogo</Link></li>
                        <li><Link href="/consignacion">Consignación</Link></li>
                        <li><Link href="/nosotros">Nosotros</Link></li>
                        <li><Link href="/faq">FAQ</Link></li>
                        <li><Link href="/blog">Blog</Link></li>
                        <li><Link href="/contacto">Contacto</Link></li>
                    </ul>

                    <div className="navbar-cta">
                        <a
                            href="https://wa.me/56912345678?text=Hola%2C%20me%20interesa%20saber%20más%20sobre%20Auto%20Directo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-whatsapp btn-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.703-1.228A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.3 0-4.438-.763-6.152-2.048l-.429-.332-3.29.859.893-3.26-.365-.447A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                            </svg>
                            WhatsApp
                        </a>
                        <button className="hamburger" onClick={toggleMobile} aria-label="Abrir menú">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
                <Link href="/catalogo" onClick={() => setMobileOpen(false)}>Catálogo</Link>
                <Link href="/consignacion" onClick={() => setMobileOpen(false)}>Consignación</Link>
                <Link href="/nosotros" onClick={() => setMobileOpen(false)}>Nosotros</Link>
                <Link href="/faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)}>Blog</Link>
                <Link href="/contacto" onClick={() => setMobileOpen(false)}>Contacto</Link>
                <a
                    href="https://wa.me/56912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                    style={{ marginTop: '0.5rem' }}
                >
                    WhatsApp
                </a>
            </div>
        </>
    );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'Consignación', href: '/consignacion' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <>
      <nav className={`navbar ${solid ? 'solid' : 'transparent'}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <Image src="/logo.svg" alt="Auto Directo" width={180} height={36} priority />
          </Link>

          {/* Desktop links */}
          <ul className="navbar-links">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>

          {/* CTA + hamburger */}
          <div className="navbar-cta">
            <Link
              href="https://wa.me/56940441470?text=Hola%2C%20me%20interesa%20saber%20más"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm"
            >
              💬 WhatsApp
            </Link>

            <button
              className="hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMobileOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="https://wa.me/56940441470?text=Hola%2C%20me%20interesa%20saber%20más"
          target="_blank"
          className="btn btn-whatsapp"
          style={{ marginTop: '0.5rem', textAlign: 'center' }}
          onClick={() => setMobileOpen(false)}
        >
          💬 WhatsApp
        </Link>
      </div>
    </>
  );
}

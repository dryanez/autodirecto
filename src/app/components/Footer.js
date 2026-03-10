import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand">
              <Image src="/logo.svg" alt="Auto Directo" width={160} height={32} />
            </div>
            <p className="footer-desc">
              Plataforma de compra y venta de vehículos 100% online.
              Transparencia, seguridad y asesoría personalizada en cada paso.
            </p>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/autodirecto.cl/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                IG
              </a>
              <a
                href="https://www.facebook.com/autodirecto.cl/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                FB
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="footer-heading">Navegación</h4>
            <ul className="footer-links">
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/catalogo">Catálogo</Link></li>
              <li><Link href="/consignacion">Consignación</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-heading">Empresa</h4>
            <ul className="footer-links">
              <li><Link href="/nosotros">Nosotros</Link></li>
              <li><Link href="/faq">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-heading">Contacto</h4>
            <ul className="footer-links">
              <li>
                <a href="mailto:contacto@autodirecto.cl">
                  contacto@autodirecto.cl
                </a>
              </li>
              <li>
                <a href="tel:+56940441470">+56 9 4044 1470</a>
              </li>
              <li>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Av. Bosques de Montemar 30,<br />
                  Of. 316, Viña del Mar
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Auto Directo. Todos los derechos reservados.</span>
          <span>Wiackowska Group SpA</span>
        </div>
      </div>
    </footer>
  );
}

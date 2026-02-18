import Link from 'next/link';
import VehicleCard from './components/VehicleCard';
import { vehicles, testimonials } from '@/lib/mockData';

export default function Home() {
  const featuredVehicles = vehicles.filter(v => v.featured).slice(0, 6);

  return (
    <>
      {/* === HERO === */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid-pattern" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Plataforma 100% Online
          </div>
          <h1>
            Compra y Vende tu Auto{' '}
            <span className="gradient-text">Sin Complicaciones</span>
          </h1>
          <p>
            La automotora digital líder en Chile. Consignación transparente, asesoría personalizada
            y todo el proceso desde la comodidad de tu hogar.
          </p>
          <div className="hero-buttons">
            <Link href="/catalogo" className="btn btn-primary btn-lg">
              🚗 Ver Catálogo
            </Link>
            <Link href="/consignacion" className="btn btn-secondary btn-lg">
              💰 Vender mi Auto
            </Link>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Busca por marca, modelo o año..."
              aria-label="Buscar vehículos"
            />
            <button>Buscar</button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">500+</div>
              <div className="hero-stat-label">Autos Vendidos</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">98%</div>
              <div className="hero-stat-label">Satisfacción</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">100%</div>
              <div className="hero-stat-label">Online</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">14</div>
              <div className="hero-stat-label">Días Promedio de Venta</div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURED VEHICLES === */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">
            Vehículos <span className="gradient-text">Destacados</span>
          </h2>
          <p className="section-subtitle">
            Nuestra selección de los mejores autos disponibles, revisados y verificados.
          </p>
          <div className="vehicles-grid">
            {featuredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <Link href="/catalogo" className="btn btn-primary">
              Ver Todo el Catálogo →
            </Link>
          </div>
        </div>
      </section>

      {/* === VALUE PROPS === */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">
            ¿Por Qué <span className="gradient-text">Auto Directo</span>?
          </h2>
          <p className="section-subtitle">
            Somos la plataforma de compra-venta de autos más transparente y moderna de Chile.
          </p>
          <div className="value-props">
            <div className="value-prop">
              <div className="value-prop-icon">🌐</div>
              <h3>100% Online</h3>
              <p>Todo el proceso desde tu celular o computador. Sin necesidad de visitar ningún lugar físico.</p>
            </div>
            <div className="value-prop">
              <div className="value-prop-icon">🔍</div>
              <h3>Total Transparencia</h3>
              <p>Informes completos, historial verificado y precios justos. Sin letra chica ni sorpresas.</p>
            </div>
            <div className="value-prop">
              <div className="value-prop-icon">🤝</div>
              <h3>Asesoría Personalizada</h3>
              <p>Nuestro equipo te guía en cada paso. Resolvemos todas tus dudas por WhatsApp.</p>
            </div>
            <div className="value-prop">
              <div className="value-prop-icon">🔒</div>
              <h3>Seguridad Garantizada</h3>
              <p>Transacciones seguras, verificación de identidad y transferencia legal en notaría.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">
            ¿Cómo <span className="gradient-text">Funciona</span>?
          </h2>
          <p className="section-subtitle">
            Vender tu auto nunca fue tan fácil. Solo 3 pasos y nosotros hacemos el resto.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Cotiza tu Auto</h3>
              <p>Envíanos los datos de tu vehículo y recibe una valoración gratuita en menos de 24 horas.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Publicamos y Gestionamos</h3>
              <p>Creamos tu publicación profesional y gestionamos todas las consultas de interesados.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>¡Vendido!</h3>
              <p>Nos encargamos de la transferencia, el papeleo y tú recibes tu dinero de forma segura.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">
            Lo Que Dicen <span className="gradient-text">Nuestros Clientes</span>
          </h2>
          <p className="section-subtitle">
            La confianza de cientos de clientes satisfechos nos respalda.
          </p>
          <div className="testimonials-grid">
            {testimonials.slice(0, 6).map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="stars">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="testimonial-quote">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-city">{testimonial.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2>¿Listo para Vender tu Auto?</h2>
            <p>Recibe una cotización gratuita en menos de 24 horas. Sin compromiso.</p>
            <Link href="/consignacion" className="btn btn-lg">
              Cotizar mi Auto Gratis →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import VehicleCard from './components/VehicleCard';
import { vehicles, testimonials, brands } from '@/lib/mockData';

export default function Home() {
  const featuredVehicles = vehicles.filter((v) => v.featured).slice(0, 6);
  const displayTestimonials = testimonials.slice(0, 3);

  return (
    <main>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="hero">
        <div className="hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80"
            alt="Vehículo premium en carretera"
          />
          <div className="hero-image-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Vehículos disponibles ahora
          </div>

          <h1>
            Encuentra tu próximo{' '}
            <span className="gradient-text">auto</span> hoy
          </h1>

          <p>
            Explora nuestra selección de vehículos nuevos y usados, listos para
            compra inmediata o consignación. 100% online, sin complicaciones.
          </p>

          {/* Search bar */}
          <form className="search-bar" action="/catalogo">
            <input
              type="text"
              name="q"
              placeholder="Busca por marca, modelo o año…"
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="hero-buttons">
            <Link href="/catalogo" className="btn btn-primary btn-lg">
              Explorar Vehículos
            </Link>
            <Link href="/consignacion" className="btn btn-secondary btn-lg">
              Consignar mi Auto
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">200+</div>
              <div className="hero-stat-label">Vehículos vendidos</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">98%</div>
              <div className="hero-stat-label">Clientes satisfechos</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">100%</div>
              <div className="hero-stat-label">Online y transparente</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VEHICLE CATEGORIES ═══════════════════ */}
      <section className="section">
        <div className="container">
          <p className="section-label">Categorías</p>
          <h2 className="section-title">Busca por tipo de vehículo</h2>

          <div className="categories-scroll">
            {['🚗 Todos', '🏎️ Sedán', '🚙 SUV', '🛻 Camioneta', '⚡ Híbrido', '🚐 Van'].map(
              (cat) => (
                <Link
                  key={cat}
                  href="/catalogo"
                  className={`category-pill${cat.includes('Todos') ? ' active' : ''}`}
                >
                  {cat}
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED VEHICLES ═══════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="featured-header">
            <div>
              <p className="section-label">Destacados</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Vehículos Destacados
              </h2>
            </div>
            <Link href="/catalogo" className="btn btn-secondary btn-sm">
              Ver todos →
            </Link>
          </div>

          <div className="vehicles-grid">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SERVICES (Trade-in / Financing) ═══════════════════ */}
      <section className="section">
        <div className="container">
          <p className="section-label">Servicios</p>
          <h2 className="section-title">Consignación y Financiamiento</h2>

          <div className="services-grid">
            {/* Consignación */}
            <Link href="/consignacion" className="service-card">
              <div className="service-card-image">
                <img
                  src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"
                  alt="Consignación de vehículos"
                />
              </div>
              <div className="service-card-body">
                <h3>Consignación</h3>
                <p>
                  Usa tu vehículo actual como parte de la compra. Nosotros
                  nos encargamos de todo el proceso de venta por ti.
                </p>
                <span className="btn btn-secondary btn-sm">
                  Saber más →
                </span>
              </div>
            </Link>

            {/* Financiamiento */}
            <Link href="/contacto" className="service-card">
              <div className="service-card-image">
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                  alt="Opciones de financiamiento"
                />
              </div>
              <div className="service-card-body">
                <h3>Financiamiento</h3>
                <p>
                  Explora soluciones de financiamiento flexibles, diseñadas
                  para ajustarse a tu presupuesto y necesidades.
                </p>
                <span className="btn btn-secondary btn-sm">
                  Saber más →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUSTED BRANDS ═══════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Marcas</p>
          <h2 className="section-title">Nuestras Marcas Asociadas</h2>

          <div className="brands-scroll">
            {brands.map((brand) => (
              <span key={brand} className="brand-logo">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <section className="section">
        <div className="container">
          <div className="about-split">
            <div className="about-image">
              <img
                src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80"
                alt="Equipo Auto Directo"
              />
            </div>
            <div className="about-text">
              <p className="section-label">Sobre nosotros</p>
              <h2 className="section-title">
                Conoce <span className="gradient-text">Auto Directo</span>
              </h2>
              <p>
                Somos la plataforma de compra y venta de vehículos 100% online
                de Chile. Nuestro modelo de consignación transparente conecta a
                vendedores y compradores de forma segura, rápida y sin trámites
                innecesarios.
              </p>
              <p>
                Desde Viña del Mar operamos a nivel nacional, ofreciendo asesoría
                personalizada, informes vehiculares completos y acompañamiento en
                cada paso del proceso.
              </p>
              <Link href="/nosotros" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Saber más
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="section">
        <div className="container">
          <p className="section-label center" style={{ textAlign: 'center' }}>Proceso</p>
          <h2 className="section-title center">¿Cómo funciona?</h2>
          <p className="section-subtitle center">
            Comprar o vender tu auto nunca fue tan fácil
          </p>

          <div className="steps-grid">
            {[
              { n: '1', title: 'Publica o Busca', desc: 'Sube tu vehículo o explora nuestro catálogo verificado.' },
              { n: '2', title: 'Conectamos', desc: 'Gestionamos interesados, negociaciones y toda la documentación.' },
              { n: '3', title: 'Listo', desc: 'Transferencia segura y pago garantizado. Sin sorpresas.' },
            ].map((step) => (
              <div className="step-card" key={step.n}>
                <div className="step-number">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section className="section">
        <div className="container">
          <p className="section-label">Testimonios</p>
          <h2 className="section-title">Opiniones de Clientes</h2>

          <div className="testimonials-grid">
            {displayTestimonials.map((t) => (
              <div className="testimonial-card" key={t.id}>
                <div className="stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="testimonial-quote">&ldquo;{t.text}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-city">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2>
              ¿Listo para encontrar tu próximo{' '}
              <span className="gradient-text">vehículo</span>?
            </h2>
            <p>Explora nuestro catálogo o consigna tu auto hoy mismo.</p>
            <div className="cta-buttons">
              <Link href="/catalogo" className="btn btn-primary btn-lg">
                Ver Vehículos
              </Link>
              <Link
                href="https://wa.me/56940441470?text=Hola%2C%20me%20interesa%20saber%20más"
                target="_blank"
                className="btn btn-whatsapp btn-lg"
              >
                💬 WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

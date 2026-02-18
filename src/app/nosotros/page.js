import Link from 'next/link';

export const metadata = {
    title: 'Quiénes Somos',
    description: 'Conoce Auto Directo, la plataforma 100% online de compra y venta de autos en Chile. Operamos desde Viña del Mar con cobertura nacional.',
};

export default function NosotrosPage() {
    return (
        <>
            <div className="page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        🏢 Sobre Nosotros
                    </span>
                    <h1>
                        Quiénes <span className="gradient-text">Somos</span>
                    </h1>
                    <p>Reinventando la forma de comprar y vender autos en Chile.</p>
                </div>
            </div>

            {/* Mission */}
            <section className="section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text">
                            <h2>Nuestra <span className="gradient-text">Misión</span></h2>
                            <p>
                                En <strong>Auto Directo</strong> creemos que comprar o vender un auto no debería ser complicado,
                                inseguro ni tedioso. Por eso creamos la primera plataforma <strong>100% digital</strong> de
                                consignación automotriz en Chile.
                            </p>
                            <p>
                                Desde nuestra oficina en <strong>Viña del Mar</strong>, operamos a nivel nacional con una
                                premisa simple: hacer que el proceso sea tan fácil como pedir algo por internet.
                                Sin largas esperas, sin papeleo innecesario y con total transparencia.
                            </p>
                            <p>
                                Somos parte del grupo <strong>Wiackowska Group Spa</strong>, con experiencia en soluciones
                                digitales y servicios automotrices. Nuestro equipo combina tecnología de punta con un
                                servicio personalizado para cada cliente.
                            </p>
                        </div>
                        <div className="about-image-placeholder">
                            🚗
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <h2 className="section-title">
                        Nuestros <span className="gradient-text">Valores</span>
                    </h2>
                    <p className="section-subtitle">
                        Los pilares que guían cada decisión en Auto Directo.
                    </p>
                    <div className="value-props">
                        <div className="value-prop">
                            <div className="value-prop-icon">💎</div>
                            <h3>Transparencia</h3>
                            <p>Sin letra chica, sin comisiones ocultas. Cada detalle claro desde el primer minuto.</p>
                        </div>
                        <div className="value-prop">
                            <div className="value-prop-icon">🎯</div>
                            <h3>Innovación</h3>
                            <p>Usamos tecnología digital para hacer el proceso más rápido, seguro y cómodo.</p>
                        </div>
                        <div className="value-prop">
                            <div className="value-prop-icon">❤️</div>
                            <h3>Compromiso</h3>
                            <p>Cada cliente es nuestra prioridad. No descansamos hasta que estés satisfecho.</p>
                        </div>
                        <div className="value-prop">
                            <div className="value-prop-icon">🛡️</div>
                            <h3>Seguridad</h3>
                            <p>Verificación rigurosa de cada vehículo y cada transacción para tu tranquilidad.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Differentiator */}
            <section className="section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-image-placeholder">
                            🌐
                        </div>
                        <div className="about-text">
                            <h2>100% <span className="gradient-text">Online</span></h2>
                            <p>
                                A diferencia de las automotoras tradicionales, en Auto Directo todo el proceso
                                es digital. No necesitas visitar una oficina, hacer filas ni perder horas de tu día.
                            </p>
                            <p>
                                Desde tu celular o computador puedes: cotizar tu auto, revisar nuestro catálogo,
                                comunicarte con nuestro equipo por WhatsApp, firmar documentos digitalmente y
                                recibir tu pago de forma segura.
                            </p>
                            <p>
                                Nuestra oficina administrativa en <strong>Avenida Bosques de Montemar 30,
                                    Oficina 316, Viña del Mar</strong> existe para respaldarte con una dirección
                                legal, pero toda la magia sucede en línea.
                            </p>
                            <div style={{ marginTop: 'var(--space-xl)' }}>
                                <Link href="/consignacion" className="btn btn-primary">
                                    Comienza Aquí →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="container">
                    <div className="cta-banner">
                        <h2>¿Quieres Ser Parte de la Revolución?</h2>
                        <p>Únete a cientos de clientes que ya confían en Auto Directo para comprar y vender sus autos.</p>
                        <Link href="/contacto" className="btn btn-lg">
                            Contáctanos →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

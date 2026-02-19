import Link from 'next/link';
import AgendarWizard from '../components/AgendarWizard';

export const metadata = {
    title: 'Agenda tu Inspección Gratuita — Auto Directo',
    description: 'Agenda una inspección mecánica completa y sesión de fotos profesional gratis. Certificamos el estado de tu vehículo para una venta segura y rápida.',
};

export default function AgendarFotosPage() {
    return (
        <>
            {/* Hero */}
            <div className="page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <span className="badge badge-accent" style={{ marginBottom: 'var(--space-lg)' }}>
                        🛡️ Certificación y Calidad
                    </span>
                    <h1>
                        Agenda tu <span className="gradient-text">Inspección Gratuita</span>
                    </h1>
                    <p style={{ maxWidth: '700px', margin: '0 auto' }}>
                        Realizamos una evaluación mecánica completa de 150 puntos y una sesión de fotos profesional.
                        <br />
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            Garantiza el mejor precio y transmite confianza a tus compradores.
                        </span>
                    </p>
                </div>
            </div>

            {/* Wizard Component */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <AgendarWizard />
                </div>
            </section>
        </>
    );
}

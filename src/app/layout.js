import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL('https://autodirecto.cl'),
  title: {
    default: 'Auto Directo — Compra y Vende tu Auto 100% Online en Chile',
    template: '%s | Auto Directo',
  },
  description: 'La plataforma más moderna de Chile para comprar y vender autos 100% online. Consignación sin complicaciones, asesoría personalizada y total transparencia. Viña del Mar.',
  keywords: [
    'comprar auto Chile', 'vender auto Chile', 'consignación autos',
    'autos usados Chile', 'automotora online', 'venta de autos Viña del Mar',
    'comprar auto online', 'consignación vehiculos', 'autos seminuevos',
    'auto directo', 'automotora digital Chile', 'vender mi auto rápido',
  ],
  authors: [{ name: 'Auto Directo' }],
  creator: 'Auto Directo',
  publisher: 'Wiackowska Group Spa',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://autodirecto.cl',
    siteName: 'Auto Directo',
    title: 'Auto Directo — Compra y Vende tu Auto 100% Online en Chile',
    description: 'La plataforma más moderna de Chile para comprar y vender autos 100% online. Consignación sin complicaciones, asesoría personalizada y total transparencia.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Auto Directo - Tu auto, sin complicaciones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auto Directo — Compra y Vende tu Auto 100% Online',
    description: 'La plataforma más moderna de Chile para comprar y vender autos 100% online.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://autodirecto.cl',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

// JSON-LD Structured Data
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: 'Auto Directo',
  description: 'Plataforma digital de compra y venta de autos 100% online en Chile.',
  url: 'https://autodirecto.cl',
  logo: 'https://autodirecto.cl/logo.png',
  telephone: '+56912345678',
  email: 'contacto@autodirecto.cl',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Avenida Bosques de Montemar 30, Oficina 316',
    addressLocality: 'Viña del Mar',
    addressRegion: 'Valparaíso',
    postalCode: '2520000',
    addressCountry: 'CL',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -33.0153,
    longitude: -71.5503,
  },
  openingHours: 'Mo-Fr 09:00-18:00',
  sameAs: [
    'https://instagram.com/autodirecto',
    'https://facebook.com/autodirecto',
    'https://tiktok.com/@autodirecto',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Chile',
  },
  priceRange: '$$',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

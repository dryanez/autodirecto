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
    'consignación vehiculos Viña del Mar', 'autos usados Valparaíso',
    'venta auto online Chile', 'mejor automotora online Chile',
  ],
  authors: [{ name: 'Auto Directo', url: 'https://autodirecto.cl' }],
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

// JSON-LD Structured Data — Organization (AutoDealer)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  '@id': 'https://autodirecto.cl/#organization',
  name: 'Auto Directo',
  legalName: 'Wiackowska Group SpA',
  description: 'Plataforma digital de compra y venta de autos 100% online en Chile. Consignación transparente, asesoría personalizada y transferencia segura desde Viña del Mar con cobertura nacional.',
  url: 'https://autodirecto.cl',
  logo: {
    '@type': 'ImageObject',
    url: 'https://autodirecto.cl/logo.svg',
    width: 300,
    height: 60,
  },
  image: 'https://autodirecto.cl/og-image.jpg',
  telephone: '+56940441470',
  email: 'contacto@autodirecto.cl',
  foundingDate: '2024',
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 5 },
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
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/autodirecto.cl/',
    'https://www.facebook.com/autodirecto.cl/',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Chile',
  },
  priceRange: '$$',
  slogan: 'Tu auto, sin complicaciones',
  knowsAbout: [
    'Consignación de vehículos',
    'Compra y venta de autos usados',
    'Financiamiento automotriz',
    'Transferencia vehicular Chile',
    'Inspección vehicular',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Vehículos disponibles',
    url: 'https://autodirecto.cl/catalogo',
  },
};

// JSON-LD — WebSite + SearchAction (for sitelinks search box in Google)
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://autodirecto.cl/#website',
  name: 'Auto Directo',
  url: 'https://autodirecto.cl',
  description: 'La plataforma más moderna de Chile para comprar y vender autos 100% online.',
  publisher: { '@id': 'https://autodirecto.cl/#organization' },
  inLanguage: 'es-CL',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://autodirecto.cl/catalogo?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

// JSON-LD — BreadcrumbList for main navigation
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://autodirecto.cl' },
    { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://autodirecto.cl/catalogo' },
    { '@type': 'ListItem', position: 3, name: 'Consignación', item: 'https://autodirecto.cl/consignacion' },
    { '@type': 'ListItem', position: 4, name: 'Blog', item: 'https://autodirecto.cl/blog' },
    { '@type': 'ListItem', position: 5, name: 'Contacto', item: 'https://autodirecto.cl/contacto' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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

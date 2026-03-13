import Link from 'next/link';

export default function VehicleCard({ vehicle }) {
  const {
    id,
    brand,
    model,
    year,
    price,
    mileage_km,
    fuel_type,
    transmission,
    color,
    image_urls,
    image_edits,
    featured,
  } = vehicle;

  const formatPrice = (p) =>
    '$' + (p / 1000000).toFixed(1).replace('.0', '') + 'M';

  const formatKm = (km) =>
    km >= 1000 ? (km / 1000).toFixed(0) + 'k km' : km + ' km';

  // Build CSS style from cover photo edits
  const coverEditStyle = (() => {
    const edits = image_edits?.[0];
    if (!edits) return {};
    const zoom = edits.zoom ?? 1;
    const panX = edits.panX ?? 0;
    const panY = edits.panY ?? 0;
    const brightness = edits.brightness ?? 100;
    const contrast = edits.contrast ?? 100;
    const saturate = edits.saturate ?? 100;
    const skewV = edits.skewV ?? 0;
    const skewH = edits.skewH ?? 0;
    const isDefault = zoom === 1 && panX === 0 && panY === 0 &&
        brightness === 100 && contrast === 100 && saturate === 100 &&
        skewV === 0 && skewH === 0;
    if (isDefault) return {};
    return {
      transform: `perspective(800px) scale(${zoom}) translate(${panX}px, ${panY}px) rotateX(${skewV}deg) rotateY(${skewH}deg)`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`,
    };
  })();

  return (
    <Link href={`/catalogo/${id}`} className="vehicle-card">
      {/* Image */}
      <div className="vehicle-card-image">
        <img
          src={image_urls?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=70'}
          alt={`${brand} ${model} ${year}`}
          loading="lazy"
          style={coverEditStyle}
        />
        {featured && (
          <div className="vehicle-card-badge">
            <span className="badge badge-accent">Destacado</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="vehicle-card-body">
        <h3 className="vehicle-card-title">
          {brand} {model}
        </h3>
        <p className="vehicle-card-year">
          {year} · {color}
        </p>

        {/* Spec pills */}
        <div className="vehicle-card-specs">
          <span className="vehicle-card-spec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
            {formatKm(mileage_km)}
          </span>
          <span className="vehicle-card-spec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            {fuel_type}
          </span>
          <span className="vehicle-card-spec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h4M14 12h4" />
            </svg>
            {transmission}
          </span>
        </div>

        {/* Footer */}
        <div className="vehicle-card-footer">
          <div className="vehicle-card-price">
            {formatPrice(price)}
            <small> CLP</small>
          </div>
          <span className="vehicle-card-link">
            Ver más →
          </span>
        </div>
      </div>
    </Link>
  );
}

import Link from 'next/link';

export default function VehicleCard({ vehicle }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatMileage = (km) => {
        return new Intl.NumberFormat('es-CL').format(km);
    };

    return (
        <Link href={`/catalogo/${vehicle.id}`} className="vehicle-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="vehicle-card-image">
                <img
                    src={vehicle.image_urls[0]}
                    alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                    loading="lazy"
                />
                {vehicle.featured && (
                    <div className="vehicle-card-badge">
                        <span className="badge badge-accent">⭐ Destacado</span>
                    </div>
                )}
            </div>
            <div className="vehicle-card-body">
                <h3 className="vehicle-card-title">{vehicle.brand} {vehicle.model}</h3>
                <p className="vehicle-card-year">{vehicle.year} · {vehicle.color}</p>
                <div className="vehicle-card-specs">
                    <span className="vehicle-card-spec">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                        </svg>
                        {formatMileage(vehicle.mileage_km)} km
                    </span>
                    <span className="vehicle-card-spec">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                        </svg>
                        {vehicle.fuel_type}
                    </span>
                    <span className="vehicle-card-spec">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        {vehicle.transmission}
                    </span>
                </div>
                <div className="vehicle-card-footer">
                    <div className="vehicle-card-price">
                        {formatPrice(vehicle.price)}
                    </div>
                    <span className="vehicle-card-link">
                        Ver más →
                    </span>
                </div>
            </div>
        </Link>
    );
}

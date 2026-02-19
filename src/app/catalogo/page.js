'use client';

import { useState, useMemo } from 'react';
import VehicleCard from '../components/VehicleCard';
import { vehicles, brands, fuelTypes, transmissions } from '@/lib/mockData';

export default function CatalogoPage() {
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedFuel, setSelectedFuel] = useState('');
    const [selectedTransmission, setSelectedTransmission] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const filteredVehicles = useMemo(() => {
        let result = [...vehicles];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(v =>
                `${v.brand} ${v.model} ${v.year} ${v.color}`.toLowerCase().includes(q)
            );
        }

        // Brand filter
        if (selectedBrand) {
            result = result.filter(v => v.brand === selectedBrand);
        }

        // Fuel filter
        if (selectedFuel) {
            result = result.filter(v => v.fuel_type === selectedFuel);
        }

        // Transmission filter
        if (selectedTransmission) {
            result = result.filter(v => v.transmission === selectedTransmission);
        }

        // Price range
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter(v => v.price >= min && (max ? v.price <= max : true));
        }

        // Sort
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'year-desc':
                result.sort((a, b) => b.year - a.year);
                break;
            case 'mileage-asc':
                result.sort((a, b) => a.mileage_km - b.mileage_km);
                break;
            default: // newest
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return result;
    }, [search, selectedBrand, selectedFuel, selectedTransmission, priceRange, sortBy]);

    const clearFilters = () => {
        setSearch('');
        setSelectedBrand('');
        setSelectedFuel('');
        setSelectedTransmission('');
        setPriceRange('');
        setSortBy('newest');
    };

    return (
        <div className="container">
            <div className="catalog-layout">
                {/* Sidebar Filters */}
                <aside className="catalog-sidebar">
                    <div className="filter-card">
                        <h3>🔍 Filtros</h3>

                        <div className="filter-section">
                            <label>Buscar</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Marca, modelo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="filter-section">
                            <label>Marca</label>
                            <select className="input-field" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                                <option value="">Todas las marcas</option>
                                {brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className="filter-section">
                            <label>Combustible</label>
                            <select className="input-field" value={selectedFuel} onChange={(e) => setSelectedFuel(e.target.value)}>
                                <option value="">Todos</option>
                                {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <div className="filter-section">
                            <label>Transmisión</label>
                            <select className="input-field" value={selectedTransmission} onChange={(e) => setSelectedTransmission(e.target.value)}>
                                <option value="">Todas</option>
                                {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="filter-section">
                            <label>Rango de Precio</label>
                            <select className="input-field" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                                <option value="">Cualquier precio</option>
                                <option value="0-12000000">Hasta $12.000.000</option>
                                <option value="12000000-15000000">$12M - $15M</option>
                                <option value="15000000-20000000">$15M - $20M</option>
                                <option value="20000000-100000000">Más de $20M</option>
                            </select>
                        </div>

                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'var(--space-md)' }} onClick={clearFilters}>
                            Limpiar Filtros
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div>
                    <div className="catalog-header">
                        <h1 style={{ fontSize: '1.75rem' }}>
                            Catálogo de Vehículos
                            <span className="catalog-count" style={{ display: 'block' }}>
                                {filteredVehicles.length} vehículos encontrados
                            </span>
                        </h1>
                        <select className="input-field" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="newest">Más recientes</option>
                            <option value="price-asc">Precio: menor a mayor</option>
                            <option value="price-desc">Precio: mayor a menor</option>
                            <option value="year-desc">Año: más nuevo</option>
                            <option value="mileage-asc">Kilometraje: menor</option>
                        </select>
                    </div>

                    <div className="vehicles-grid">
                        {filteredVehicles.map(vehicle => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} />
                        ))}
                    </div>

                    {filteredVehicles.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--color-text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔍</div>
                            <h3>No encontramos vehículos con esos filtros</h3>
                            <p>Intenta cambiar los filtros o buscar algo diferente.</p>
                            <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={clearFilters}>
                                Ver Todos los Vehículos
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

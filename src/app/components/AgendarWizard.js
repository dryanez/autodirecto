'use client';

import { useState, useEffect } from 'react';

// Data for regions and communes from the original app
const regionsCommunes = {
    "XV": ["Arica", "Camarones", "Putre", "General Lagos"],
    "I": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "II": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "III": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "IV": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "V": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
    "RM": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Til Til", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "VI": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "VII": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "XVI": ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"],
    "VIII": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"],
    "IX": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "XIV": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "X": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "XI": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "XII": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
};

// Map region codes to display names
const regionNames = {
    "XV": "Arica y Parinacota",
    "I": "Tarapacá",
    "II": "Antofagasta",
    "III": "Atacama",
    "IV": "Coquimbo",
    "V": "Valparaíso",
    "RM": "Metropolitana de Santiago",
    "VI": "O'Higgins",
    "VII": "Maule",
    "XVI": "Ñuble",
    "VIII": "Biobío",
    "IX": "Araucanía",
    "XIV": "Los Ríos",
    "X": "Los Lagos",
    "XI": "Aysén",
    "XII": "Magallanes"
};

export default function AgendarWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        region: '',
        commune: '',
        address: '',
        plate: '',
        mileage: '',
        version: '',
        appointmentDate: ''
    });
    const [carData, setCarData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Helpers
    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => {
        setError('');
        setStep(prev => prev - 1);
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Step Logic
    const handleNext = async () => {
        setError('');

        // Validation per step
        if (step === 1) {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                setError('Por favor ingresa tu nombre y apellido');
                return;
            }
        } else if (step === 2) {
            // Basic phone validation for now
            if (!formData.phone.trim() || formData.phone.length < 8) {
                setError('Por favor ingresa un número de teléfono válido');
                return;
            }
        } else if (step === 3) {
            if (!validateEmail(formData.email)) {
                setError('Por favor ingresa un email válido');
                return;
            }
        } else if (step === 4) {
            if (!formData.region || !formData.commune || !formData.address.trim()) {
                setError('Por favor completa tu dirección');
                return;
            }
        }

        // Special handling for Plate lookup (Step 5)
        if (step === 5) {
            const plate = formData.plate.trim().toUpperCase();
            if (!plate || plate.length < 5) {
                setError('Ingresa una patente válida');
                return;
            }

            setLoading(true);
            try {
                // Call our Proxy API
                const res = await fetch(`/api/mrcar/vehicle/${plate}`);
                const data = await res.json();

                if (!res.ok || !data.success) throw new Error(data.error || 'No pudimos encontrar el vehículo');

                setCarData(data);
                setFormData(prev => ({ ...prev, carData: data })); // Backend expects nested carData
                setLoading(false);
                nextStep();
                return;
            } catch (err) {
                setLoading(false);
                setError(err.message);
                return;
            }
        }

        // Special handling for Scheduling (Step 7)
        if (step === 7) {
            if (!formData.appointmentDate) {
                setError('Selecciona una fecha y hora');
                return;
            }

            setLoading(true);
            try {
                const res = await fetch('/api/mrcar/schedule-appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();

                if (!res.ok || !data.success) throw new Error(data.error || 'Error al agendar la cita');

                setLoading(false);
                setSuccess(true);
                return;
            } catch (err) {
                setLoading(false);
                setError(err.message);
                return;
            }
        }

        nextStep();
    };

    if (success) {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✅</div>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>¡Visita Agendada!</h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Hemos confirmado tu cita para el <br />
                    <strong style={{ color: 'var(--color-primary)' }}>{new Date(formData.appointmentDate).toLocaleString()}</strong>
                </p>
                <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                    <p>Un ejecutivo te contactará pronto al <strong>{formData.phone}</strong> para confirmar los detalles.</p>
                </div>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            {/* Progress Bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-bg-secondary)' }}>
                <div style={{
                    height: '100%',
                    background: 'var(--color-accent-gradient)',
                    width: `${(step / 7) * 100}%`,
                    transition: 'width 0.3s ease'
                }} />
            </div>

            <div style={{ padding: 'var(--space-xl)' }}>
                {/* Step Title */}
                <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    {step === 1 && '¿Cuál es tu nombre?'}
                    {step === 2 && '¿Cuál es tu teléfono?'}
                    {step === 3 && '¿Cuál es tu correo?'}
                    {step === 4 && '¿Dónde te encuentras?'}
                    {step === 5 && '¿Cuál es la patente?'}
                    {step === 6 && 'Detalles del Vehículo'}
                    {step === 7 && 'Elige un horario'}
                </h2>

                {/* Loading Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--space-md)' }}></div>
                        <p>Procesando...</p>
                    </div>
                ) : (
                    <div className="wizard-content animate-fadeIn">

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                background: 'rgba(255, 59, 48, 0.1)',
                                border: '1px solid var(--color-error)',
                                color: 'var(--color-error)',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-lg)',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* STEP 1: Name */}
                        {step === 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Nombre"
                                    value={formData.firstName}
                                    onChange={e => updateFormData('firstName', e.target.value)}
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Apellido"
                                    value={formData.lastName}
                                    onChange={e => updateFormData('lastName', e.target.value)}
                                />
                            </div>
                        )}

                        {/* STEP 2: Phone */}
                        {step === 2 && (
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="+56 9 1234 5678"
                                value={formData.phone}
                                onChange={e => updateFormData('phone', e.target.value)}
                                autoFocus
                            />
                        )}

                        {/* STEP 3: Email */}
                        {step === 3 && (
                            <input
                                type="email"
                                className="input-field"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={e => updateFormData('email', e.target.value)}
                                autoFocus
                            />
                        )}

                        {/* STEP 4: Location */}
                        {step === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <select
                                    className="input-field"
                                    value={formData.region}
                                    onChange={e => {
                                        updateFormData('region', e.target.value);
                                        updateFormData('commune', ''); // Reset commune on region change
                                    }}
                                >
                                    <option value="">Selecciona tu región</option>
                                    {Object.keys(regionsCommunes).map(r => (
                                        <option key={r} value={r}>{regionNames[r] || r}</option>
                                    ))}
                                </select>

                                <select
                                    className="input-field"
                                    value={formData.commune}
                                    onChange={e => updateFormData('commune', e.target.value)}
                                    disabled={!formData.region}
                                >
                                    <option value="">Selecciona tu comuna</option>
                                    {formData.region && regionsCommunes[formData.region]?.sort().map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Dirección (Calle y Número)"
                                    value={formData.address}
                                    onChange={e => updateFormData('address', e.target.value)}
                                />
                            </div>
                        )}

                        {/* STEP 5: Plate */}
                        {step === 5 && (
                            <div style={{ textAlign: 'center' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="ABCD12"
                                    maxLength={6}
                                    style={{
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        fontSize: '2rem',
                                        letterSpacing: '0.2em',
                                        width: '200px',
                                        margin: '0 auto'
                                    }}
                                    value={formData.plate}
                                    onChange={e => updateFormData('plate', e.target.value.toUpperCase())}
                                    autoFocus
                                />
                                <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                                    Ingresa la patente para buscar los datos
                                </p>
                            </div>
                        )}

                        {/* STEP 6: Vehicle Details */}
                        {step === 6 && (
                            <div>
                                {carData && (
                                    <div style={{
                                        background: 'var(--color-bg-secondary)',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--space-lg)',
                                        textAlign: 'center'
                                    }}>
                                        <span className="badge badge-accent" style={{ marginBottom: 'var(--space-sm)' }}>Vehículo Encontrado</span>
                                        <h3 style={{ margin: 'var(--space-xs) 0' }}>{carData.make} {carData.model}</h3>
                                        <p style={{ color: 'var(--color-text-secondary)' }}>Año: {carData.year}</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Versión (Opcional)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ej: GLX 2.0"
                                            value={formData.version}
                                            onChange={e => updateFormData('version', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Kilometraje</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Ej: 50000"
                                            value={formData.mileage}
                                            onChange={e => updateFormData('mileage', e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 7: Check Date */}
                        {step === 7 && (
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Fecha y Hora</label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={formData.appointmentDate}
                                    onChange={e => updateFormData('appointmentDate', e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    style={{ fontSize: '1.1rem' }}
                                />
                                <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    Selecciona un horario entre 9:00 y 19:00 hrs.
                                </p>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                            {step > 1 && (
                                <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Volver
                                </button>
                            )}
                            <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }}>
                                {step === 5 ? 'Buscar Vehículo' : step === 7 ? 'Confirmar Cita' : 'Continuar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

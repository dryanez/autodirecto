'use client';

import { useState, useEffect, useMemo } from 'react';

// ─── Calendar Helpers ───
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    // Shift so Monday = 0
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
}

function isDateDisabled(year, month, day) {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Disable past days and Sundays
    return date < today || date.getDay() === 0;
}

// ─── Calendar Component ───
function CalendarPicker({ selectedDate, selectedTime, onSelectDate, onSelectTime }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Don't allow navigating to past months
    const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

    return (
        <div>
            {/* Month Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <button
                    type="button"
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    style={{
                        background: 'none', border: 'none', color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        cursor: canGoPrev ? 'pointer' : 'default', fontSize: '1.5rem', padding: 'var(--space-sm)'
                    }}
                >←</button>
                <h3 style={{ margin: 0 }}>{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                <button
                    type="button"
                    onClick={nextMonth}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '1.5rem', padding: 'var(--space-sm)' }}
                >→</button>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: 'var(--space-xs)' }}>
                {DAYS_OF_WEEK.map(d => (
                    <div key={d} style={{ padding: 'var(--space-xs)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{d}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: 'var(--space-lg)' }}>
                {days.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const disabled = isDateDisabled(viewYear, viewMonth, day);
                    const isSelected = selectedDate === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelectDate(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                            style={{
                                padding: 'var(--space-sm)',
                                borderRadius: 'var(--radius-sm)',
                                border: isToday && !isSelected ? '1px solid var(--color-accent)' : '1px solid transparent',
                                background: isSelected ? 'var(--color-accent)' : disabled ? 'transparent' : 'var(--color-bg-secondary)',
                                color: isSelected ? '#fff' : disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                cursor: disabled ? 'default' : 'pointer',
                                fontWeight: isSelected || isToday ? 700 : 400,
                                fontSize: '0.95rem',
                                transition: 'var(--transition-fast)',
                                opacity: disabled ? 0.4 : 1
                            }}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Time Slots — Only shown after a date is selected */}
            {selectedDate && (
                <div className="animate-fadeIn">
                    <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                        Horarios disponibles para el <span style={{ color: 'var(--color-accent)' }}>{selectedDate.split('-').reverse().join('/')}</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)' }}>
                        {TIME_SLOTS.map(time => {
                            const isSelected = selectedTime === time;
                            return (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => onSelectTime(time)}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-xs)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                        background: isSelected ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                        color: isSelected ? '#fff' : 'var(--color-text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: isSelected ? 700 : 400,
                                        fontSize: '0.9rem',
                                        transition: 'var(--transition-fast)'
                                    }}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>

                    {/* Confirmation notice */}
                    <div style={{
                        marginTop: 'var(--space-lg)',
                        padding: 'var(--space-md)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        gap: 'var(--space-sm)',
                        alignItems: 'flex-start'
                    }}>
                        <span style={{ fontSize: '1.3rem' }}>📞</span>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                            <strong style={{ color: 'var(--color-text-primary)' }}>Importante:</strong> Un ejecutivo de Auto Directo se comunicará contigo <strong style={{ color: 'var(--color-accent)' }}>un día antes</strong> de la fecha seleccionada para confirmar la visita y coordinar los últimos detalles.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

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
        rut: '',
        countryCode: '+56',
        phone: '',
        email: '',
        region: '',
        commune: '',
        address: '',
        plate: '',
        mileage: '',
        version: '',
        appointmentDate: '',
        appointmentTime: ''
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

    const validateRut = (rut) => {
        if (!rut) return false;
        const clean = rut.replace(/\./g, '').replace(/-/g, '');
        if (clean.length < 8 || clean.length > 9) return false;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1).toUpperCase();
        let sum = 0, mul = 2;
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * mul;
            mul = mul === 7 ? 2 : mul + 1;
        }
        const expected = 11 - (sum % 11);
        const dvExpected = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
        return dv === dvExpected;
    };

    const formatRut = (value) => {
        let clean = value.replace(/[^0-9kK]/g, '');
        if (clean.length > 9) clean = clean.slice(0, 9);
        if (clean.length <= 1) return clean;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1);
        const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formatted}-${dv}`;
    };

    // Step Logic
    const handleNext = async () => {
        setError('');

        // Validation per step (8 steps total)
        // Step 1: Name, Step 2: RUT, Step 3: Phone, Step 4: Email, Step 5: Location, Step 6: Plate, Step 7: Vehicle, Step 8: Calendar
        if (step === 1) {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                setError('Por favor ingresa tu nombre y apellido');
                return;
            }
        } else if (step === 2) {
            if (!formData.rut.trim() || !validateRut(formData.rut)) {
                setError('Por favor ingresa un RUT válido (ej: 12.345.678-9)');
                return;
            }
        } else if (step === 3) {
            const fullPhone = formData.phone.replace(/\s/g, '');
            if (!fullPhone || fullPhone.length < 8) {
                setError('Por favor ingresa un número de teléfono válido');
                return;
            }
        } else if (step === 4) {
            if (!validateEmail(formData.email)) {
                setError('Por favor ingresa un email válido');
                return;
            }
        } else if (step === 5) {
            if (!formData.region || !formData.commune || !formData.address.trim()) {
                setError('Por favor completa tu dirección');
                return;
            }
        }

        // Special handling for Plate lookup (Step 6)
        if (step === 6) {
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

                if (!res.ok || !data.success) {
                    // Manually trigger the fallback logic without throwing an error that gets caught and displayed
                    setCarData(null);
                    setFormData(prev => ({ ...prev, carData: { make: '', model: '', year: '' } }));
                    setLoading(false);
                    setError(''); // Clear any previous errors
                    nextStep(); // Move to Step 7 to ask for manual input
                    return;
                }

                setCarData(data);
                setFormData(prev => ({ ...prev, carData: data })); // Backend expects nested carData
                setLoading(false);
                nextStep();
                return;
            } catch (err) {
                // Fallback to manual entry if network/fetch fails completely
                setCarData(null);
                setFormData(prev => ({ ...prev, carData: { make: '', model: '', year: '' } }));
                setLoading(false);
                setError('');
                nextStep(); // Move to Step 7 to ask for manual input
                return;
            }
        }

        if (step === 7) {
            if (!carData) {
                const cData = formData.carData || {};
                if (!cData.make || !cData.make.trim()) {
                    setError('Por favor ingresa la marca del vehículo');
                    return;
                }
                if (!cData.model || !cData.model.trim()) {
                    setError('Por favor ingresa el modelo del vehículo');
                    return;
                }
                const yearNum = parseInt(cData.year);
                if (!yearNum || isNaN(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear() + 1) {
                    setError('Por favor ingresa un año válido (ej: 2018)');
                    return;
                }
            }
            if (!formData.mileage || isNaN(formData.mileage)) {
                setError('Por favor ingresa el kilometraje actual');
                return;
            }
        }

        // Special handling for Scheduling (Step 8)
        if (step === 8) {
            if (!formData.appointmentDate || !formData.appointmentTime) {
                setError('Selecciona una fecha y un horario');
                return;
            }

            setLoading(true);
            try {
                // Combine date + time into ISO string
                const fullDateTime = `${formData.appointmentDate}T${formData.appointmentTime}:00`;
                const payload = { ...formData, appointmentDate: fullDateTime };

                // 1. Save to Supabase via our appointments API (The Bridge data layer)
                const supaRes = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        carData: formData.carData || null,
                    })
                });
                const supaData = await supaRes.json();
                if (!supaRes.ok || !supaData.success) {
                    console.warn('[Wizard] Supabase save warning:', supaData.error);
                    // Non-blocking — continue even if Supabase is not configured
                }

                // 2. Create consignacion directly in the CRM (SimplyAPI)
                const crmRes = await fetch('/api/crm/api/consignaciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const crmData = await crmRes.json();
                if (!crmRes.ok || !crmData.ok) {
                    console.warn('[Wizard] CRM consignacion warning:', crmData.error);
                    // Non-blocking — show success regardless
                }

                // 3. Also call the MrCar proxy for backward compatibility
                const res = await fetch('/api/mrcar/schedule-appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
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
        const appointmentDisplay = formData.appointmentDate
            ? `${formData.appointmentDate.split('-').reverse().join('/')} a las ${formData.appointmentTime} hrs`
            : '';

        return (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✅</div>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>¡Visita Agendada!</h2>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Hemos registrado tu cita para el <br />
                    <strong style={{ color: 'var(--color-primary)' }}>{appointmentDisplay}</strong>
                </p>
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-lg)',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.3rem' }}>📞</span>
                        <div>
                            <p style={{ margin: '0 0 var(--space-sm) 0', fontWeight: 600 }}>¿Qué sigue?</p>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Un ejecutivo de Auto Directo se comunicará contigo al <strong>{formData.countryCode} {formData.phone}</strong> <strong style={{ color: 'var(--color-accent)' }}>un día antes</strong> de la fecha de tu cita para confirmar la visita y coordinar los detalles de la inspección.
                            </p>
                        </div>
                    </div>
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
                    width: `${(step / 8) * 100}%`,
                    transition: 'width 0.3s ease'
                }} />
            </div>

            <div style={{ padding: 'var(--space-xl)' }}>
                {/* Step Title */}
                <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    {step === 1 && '¿Cuál es tu nombre?'}
                    {step === 2 && '¿Cuál es tu RUT?'}
                    {step === 3 && '¿Cuál es tu teléfono?'}
                    {step === 4 && '¿Cuál es tu correo?'}
                    {step === 5 && '¿Dónde te encuentras?'}
                    {step === 6 && '¿Cuál es la patente?'}
                    {step === 7 && 'Detalles del Vehículo'}
                    {step === 8 && 'Elige un horario'}
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

                        {/* STEP 2: RUT */}
                        {step === 2 && (
                            <div style={{ textAlign: 'center' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="12.345.678-9"
                                    value={formData.rut}
                                    onChange={e => updateFormData('rut', formatRut(e.target.value))}
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.05em', maxWidth: '280px', margin: '0 auto' }}
                                />
                                <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Necesitamos tu RUT para generar la documentación
                                </p>
                            </div>
                        )}

                        {/* STEP 3: Phone with Country Code */}
                        {step === 3 && (
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'stretch' }}>
                                <select
                                    className="input-field"
                                    value={formData.countryCode}
                                    onChange={e => updateFormData('countryCode', e.target.value)}
                                    style={{ width: '120px', flexShrink: 0, fontSize: '0.95rem' }}
                                >
                                    <option value="+56">🇨🇱 +56</option>
                                    <option value="+54">🇦🇷 +54</option>
                                    <option value="+55">🇧🇷 +55</option>
                                    <option value="+57">🇨🇴 +57</option>
                                    <option value="+51">🇵🇪 +51</option>
                                    <option value="+52">🇲🇽 +52</option>
                                    <option value="+598">🇺🇾 +598</option>
                                    <option value="+591">🇧🇴 +591</option>
                                    <option value="+593">🇪🇨 +593</option>
                                    <option value="+595">🇵🇾 +595</option>
                                    <option value="+58">🇻🇪 +58</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+34">🇪🇸 +34</option>
                                </select>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="9 1234 5678"
                                    value={formData.phone}
                                    onChange={e => updateFormData('phone', e.target.value)}
                                    autoFocus
                                    style={{ flex: 1 }}
                                />
                            </div>
                        )}

                        {/* STEP 4: Email */}
                        {step === 4 && (
                            <input
                                type="email"
                                className="input-field"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={e => updateFormData('email', e.target.value)}
                                autoFocus
                            />
                        )}

                        {/* STEP 5: Location */}
                        {step === 5 && (
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

                        {/* STEP 6: Plate */}
                        {step === 6 && (
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

                        {/* STEP 7: Vehicle Details */}
                        {step === 7 && (
                            <div>
                                {carData ? (
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
                                ) : (
                                    <div style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                                        <div style={{
                                            background: '#fffbeb',
                                            border: '1px solid #f59e0b',
                                            color: '#b45309',
                                            padding: 'var(--space-sm) var(--space-md)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--space-lg)',
                                            fontSize: '0.9rem'
                                        }}>
                                            No pudimos recuperar los datos de la patente <strong>{formData.plate}</strong> automáticamente. Por favor, ingresa los datos de forma manual.
                                        </div>
                                        <div style={{ display: 'grid', gap: 'var(--space-md)', textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Marca</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Ej: Toyota"
                                                    value={formData.carData?.make || ''}
                                                    onChange={e => updateFormData('carData', { ...formData.carData, make: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Modelo</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Ej: Yaris"
                                                    value={formData.carData?.model || ''}
                                                    onChange={e => updateFormData('carData', { ...formData.carData, model: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Año</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    placeholder="Ej: 2020"
                                                    value={formData.carData?.year || ''}
                                                    onChange={e => updateFormData('carData', { ...formData.carData, year: e.target.value })}
                                                />
                                            </div>
                                        </div>
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

                        {/* STEP 8: Calendar Picker */}
                        {step === 8 && (
                            <CalendarPicker
                                selectedDate={formData.appointmentDate}
                                selectedTime={formData.appointmentTime}
                                onSelectDate={(date) => updateFormData('appointmentDate', date)}
                                onSelectTime={(time) => updateFormData('appointmentTime', time)}
                            />
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                            {step > 1 && (
                                <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Volver
                                </button>
                            )}
                            <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }}>
                                {step === 6 ? 'Buscar Vehículo' : step === 8 ? 'Confirmar Cita' : 'Continuar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

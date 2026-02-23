import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { vehicles as mockVehicles } from '@/lib/mockData';

export const revalidate = 60; // revalidate every 60s

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            // Single listing by id
            const { data, error } = await supabaseAdmin
                .from('listings')
                .select('*')
                .eq('id', id)
                .eq('status', 'disponible')
                .single();

            if (error || !data) {
                // Fall back to mock data
                const mock = mockVehicles.find(v => v.id === parseInt(id));
                if (mock) return NextResponse.json(mock);
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            return NextResponse.json(normalizeRow(data));
        }

        // All active listings
        const { data, error } = await supabaseAdmin
            .from('listings')
            .select('*')
            .eq('status', 'disponible')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[listings API] Supabase error:', error.message);
            // Fall back to mock data
            return NextResponse.json(mockVehicles);
        }

        // Merge: real listings first, then fill with mock if none exist yet
        const rows = (data && data.length > 0) ? data.map(normalizeRow) : mockVehicles;
        return NextResponse.json(rows);

    } catch (err) {
        console.error('[listings API] Unexpected error:', err);
        return NextResponse.json(mockVehicles);
    }
}

// Normalize a Supabase listings row to match the shape expected by VehicleCard / detail page
const FEATURE_MAP = {
    aireAcondicionado:     '❄️ Aire acondicionado',
    bluetooth:             '🎵 Bluetooth',
    carplayAndroid:        '📱 CarPlay / Android Auto',
    conexionUsb:           '🔌 Conexión USB',
    gps:                   '📍 GPS / Navegación',
    isofix:                '👶 ISOFIX',
    smartKey:              '🔑 Smart Key',
    lucesLed:              '💡 Luces LED',
    mandosVolante:         '🎛️ Mandos en volante',
    sensorEstacionamiento: '🅿️ Sensor de estacionamiento',
    sonidoPremium:         '🔊 Sonido premium',
    techoElectrico:        '🪟 Techo eléctrico',
    ventiladorAsiento:     '💨 Ventilador de asiento',
    calefactorAsiento:     '🔥 Calefactor de asiento',
};

function featuresToArray(features) {
    if (Array.isArray(features)) return features;          // already array (mock data)
    if (!features || typeof features !== 'object') return [];
    return Object.entries(features)
        .filter(([, v]) => v)
        .map(([k]) => FEATURE_MAP[k] || k);
}

function normalizeRow(row) {
    return {
        id:           row.id,          // UUID string
        brand:        row.brand || '',
        model:        row.model || '',
        year:         row.year || new Date().getFullYear(),
        price:        row.price || 0,
        mileage_km:   row.mileage_km || 0,
        fuel_type:    row.fuel_type || 'Bencina',
        transmission: row.transmission || 'Manual',
        color:        row.color || '',
        description:  row.description || '',
        image_urls:   Array.isArray(row.image_urls) ? row.image_urls : (row.image_urls ? [row.image_urls] : [
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'
        ]),
        features:     featuresToArray(row.features),
        plate:        row.plate || '',
        motor:        row.motor || '',
        body_type:    row.body_type || '',
        doors:        row.doors || null,
        featured:     row.featured || false,
        status:       row.status || 'disponible',
        created_at:   row.created_at || new Date().toISOString(),
        // extra for detail page
        consignacion_id: row.consignacion_id,
        appraisal_id:    row.appraisal_id,
    };
}

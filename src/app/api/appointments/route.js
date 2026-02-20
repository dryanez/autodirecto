import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/appointments
 * 
 * Saves appointment data to Supabase `appointments` table.
 * This is "The Bridge" — it stores the data in a shared Supabase database
 * so that the Simply AI / Funnels app can read and match leads.
 *
 * Flow:
 *  1. Client fills form on Autodirecto (this app)
 *  2. Data is saved to Supabase `appointments` table
 *  3. Simply AI / Funnels app reads from the SAME Supabase database
 *  4. Match is done by: auto (make+model+year) + nombre + km
 */
export async function POST(request) {
    try {
        const body = await request.json();

        const {
            firstName,
            lastName,
            rut,
            countryCode,
            phone,
            email,
            region,
            commune,
            address,
            plate,
            mileage,
            version,
            appointmentDate,
            appointmentTime,
            carData // { make, model, year, ... }
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !phone || !plate || !appointmentDate) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos obligatorios' },
                { status: 400 }
            );
        }

        if (!isSupabaseConfigured()) {
            console.warn('[Appointments API] Supabase not configured — returning mock success');
            return NextResponse.json({
                success: true,
                id: `mock-${Date.now()}`,
                message: 'Cita registrada (modo demo)',
                match_hint: 'Supabase no configurado — configura las variables de entorno para activar el matching.'
            });
        }

        // Build the appointment record
        const appointmentRecord = {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            rut: rut || null,
            country_code: countryCode || '+56',
            phone,
            email: email || null,
            region: region || null,
            commune: commune || null,
            address: address || null,
            plate: plate.toUpperCase(),
            mileage: mileage ? parseInt(mileage, 10) : null,
            version: version || null,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime || null,
            // Car data for matching
            car_make: carData?.make || null,
            car_model: carData?.model || null,
            car_year: carData?.year || null,
            // Matching / status fields
            status: 'agendado',
            source: 'autodirecto',
            matched: false,
            matched_funnel_id: null,
            created_at: new Date().toISOString()
        };

        // Save to Supabase
        const { data, error } = await supabaseAdmin
            .from('appointments')
            .insert([appointmentRecord])
            .select()
            .single();

        if (error) {
            console.error('[Appointments API] Supabase insert error:', error);
            return NextResponse.json(
                { success: false, error: `Error al guardar: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            message: 'Cita agendada exitosamente'
        });

    } catch (err) {
        console.error('[Appointments API] Error:', err);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/appointments
 * 
 * Retrieves appointments — used by the team's "Grid" view
 * and by the Simply AI / Funnels app to find matches.
 * 
 * Query params:
 *  ?status=agendado          — filter by status
 *  ?plate=ABCD12             — find by plate (for matching)
 *  ?car_make=Toyota&car_model=Corolla&mileage=50000 — "Match Mágico"
 *  ?from=2026-02-01&to=2026-02-28  — date range for the Grid
 */
export async function GET(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Supabase no configurado — sin datos'
            });
        }

        const { searchParams } = new URL(request.url);
        let query = supabaseAdmin.from('appointments').select('*');

        // Filters
        const status = searchParams.get('status');
        if (status) query = query.eq('status', status);

        const plate = searchParams.get('plate');
        if (plate) query = query.eq('plate', plate.toUpperCase());

        const carMake = searchParams.get('car_make');
        if (carMake) query = query.ilike('car_make', `%${carMake}%`);

        const carModel = searchParams.get('car_model');
        if (carModel) query = query.ilike('car_model', `%${carModel}%`);

        const mileage = searchParams.get('mileage');
        if (mileage) {
            const km = parseInt(mileage, 10);
            // Match within ±5000 km tolerance
            query = query.gte('mileage', km - 5000).lte('mileage', km + 5000);
        }

        const fullName = searchParams.get('name');
        if (fullName) query = query.ilike('full_name', `%${fullName}%`);

        const from = searchParams.get('from');
        if (from) query = query.gte('appointment_date', from);

        const to = searchParams.get('to');
        if (to) query = query.lte('appointment_date', to);

        query = query.order('appointment_date', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error('[Appointments API] Supabase query error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (err) {
        console.error('[Appointments API] GET Error:', err);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

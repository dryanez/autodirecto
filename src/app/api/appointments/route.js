import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { Resend } from 'resend';

// ─── Notification helpers ────────────────────────────────────────────────────

// Send WhatsApp via CallMeBot
async function sendCallMeBot(message) {
    try {
        const phone   = '4917632407062';
        const apikey  = '4106204';
        const encoded = encodeURIComponent(message);
        const url     = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`;
        await fetch(url);
        console.log('[Appointments] ✅ WhatsApp notification sent');
    } catch (err) {
        console.error('[Appointments] ❌ CallMeBot error:', err.message);
    }
}

// Send confirmation email via Resend
async function sendConfirmationEmail({ firstName, lastName, email, phone, plate, carData, appointmentDate, appointmentTime, commune, region }) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        console.warn('[Appointments] ⚠️  RESEND_API_KEY not set — skipping email');
        return;
    }
    try {
        const resend = new Resend(resendKey);
        const car    = carData?.make && carData?.model
            ? `${carData.make} ${carData.model}${carData.year ? ` (${carData.year})` : ''}`
            : plate;

        const html = `
        <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
          <div style="background:#171719;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <img src="https://mrcar-cotizacion.vercel.app/static/logo-rounded.png"
                 alt="Auto Directo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;padding:8px;background:#fff;">
            <h2 style="color:#f86120;margin:12px 0 0;">Auto Directo</h2>
          </div>

          <div style="background:#fff;border:1px solid #eee;padding:28px;border-radius:0 0 12px 12px;">
            <h3 style="color:#1a202c;margin-top:0;">📅 Nueva Cita Agendada</h3>

            <table style="width:100%;border-collapse:collapse;font-size:15px;">
              <tr><td style="padding:8px 0;color:#666;width:40%;">👤 Cliente</td>
                  <td style="padding:8px 0;font-weight:600;">${firstName} ${lastName}</td></tr>
              <tr style="background:#f9f9f9;">
                  <td style="padding:8px 4px;color:#666;">📱 Teléfono</td>
                  <td style="padding:8px 4px;font-weight:600;">${phone}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">📧 Email</td>
                  <td style="padding:8px 0;font-weight:600;">${email || '—'}</td></tr>
              <tr style="background:#f9f9f9;">
                  <td style="padding:8px 4px;color:#666;">🚗 Vehículo</td>
                  <td style="padding:8px 4px;font-weight:600;">${car}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">🔖 Patente</td>
                  <td style="padding:8px 0;font-weight:600;">${plate}</td></tr>
              <tr style="background:#f9f9f9;">
                  <td style="padding:8px 4px;color:#666;">📍 Ubicación</td>
                  <td style="padding:8px 4px;font-weight:600;">${commune || ''} ${region ? `(${region})` : ''}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">📅 Fecha</td>
                  <td style="padding:8px 0;font-weight:700;color:#f86120;font-size:17px;">${appointmentDate?.split('T')[0] || appointmentDate}</td></tr>
              <tr style="background:#f9f9f9;">
                  <td style="padding:8px 4px;color:#666;">🕐 Hora</td>
                  <td style="padding:8px 4px;font-weight:700;color:#f86120;font-size:17px;">${appointmentTime} hrs</td></tr>
            </table>

            <div style="margin-top:24px;padding:14px;background:#fff8f5;border:1px solid #f86120;border-radius:8px;font-size:13px;color:#555;">
              💡 Recuerda contactar al cliente <strong>un día antes</strong> para confirmar la visita.
            </div>
          </div>
          <p style="text-align:center;font-size:11px;color:#aaa;margin-top:12px;">Auto Directo — Sistema de Gestión de Citas</p>
        </div>`;

        await resend.emails.send({
            from:    'Auto Directo <contacto@autodirecto.cl>',
            to:      ['felipe@autodirecto.cl'],
            subject: `📅 Nueva Cita: ${firstName} ${lastName} — ${car} — ${appointmentDate?.split('T')[0] || appointmentDate} ${appointmentTime}`,
            html,
        });
        console.log('[Appointments] ✅ Email sent to felipe@autodirecto.cl');
    } catch (err) {
        console.error('[Appointments] ❌ Resend error:', err.message);
    }
}

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

        // ─── Notifications (non-blocking) ────────────────────────────────────
        const car = carData?.make && carData?.model
            ? `${carData.make} ${carData.model}${carData.year ? ` ${carData.year}` : ''}`
            : plate.toUpperCase();

        const dateDisplay = appointmentDate?.split('T')[0] || appointmentDate;

        // 1. WhatsApp via CallMeBot
        const waMsg = `🚗 NUEVA CITA - Auto Directo\n\n👤 ${firstName} ${lastName}\n📱 ${countryCode} ${phone}\n🔖 Patente: ${plate.toUpperCase()}\n🚘 ${car}\n📅 Fecha: ${dateDisplay}\n🕐 Hora: ${appointmentTime} hrs\n📍 ${commune || ''}, ${region || ''}`;
        sendCallMeBot(waMsg);

        // 2. Email via Resend
        sendConfirmationEmail({ firstName, lastName, email, phone, plate: plate.toUpperCase(), carData, appointmentDate, appointmentTime, commune, region });

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

import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/bridge/match
 * 
 * "The Bridge" — App #3: El Match Mágico
 * 
 * Called by Simply AI / Funnels app to find a matching appointment
 * in Autodirecto's database. The lead comes from Facebook funnels
 * so we do NOT have the plate — we match by:
 * 
 *   1. car_make + car_model + car_year (strongest combo)
 *   2. name (full_name fuzzy)
 *   3. mileage (±5,000 km tolerance)
 *   4. phone (if available)
 * 
 * Request body:
 * {
 *   "name": "Juan Pérez",
 *   "car_make": "Toyota",
 *   "car_model": "Corolla",
 *   "car_year": 2020,
 *   "mileage": 50000,
 *   "phone": "+56912345678",    // optional
 *   "funnel_lead_id": "abc123"  // ID from Funnels/SimplyAI
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "matched": true,
 *   "appointment": { ... },
 *   "confidence": "high" | "medium" | "low",
 *   "match_details": { "fields_matched": [...], "score": 5 }
 * }
 */
export async function POST(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase no está configurado',
                hint: 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
            }, { status: 503 });
        }

        const body = await request.json();
        const { name, car_make, car_model, car_year, mileage, phone, funnel_lead_id } = body;

        // Need at least car info or name to attempt a match
        if (!car_make && !car_model && !name && !phone) {
            return NextResponse.json({
                success: false,
                error: 'Se necesita al menos: car_make, car_model, name o phone para buscar coincidencia'
            }, { status: 400 });
        }

        // ── Strategy 1: Phone match (if provided — quick win) ──
        let candidates = [];

        if (phone) {
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');
            // Try last 8 digits for flexible matching
            const phoneSuffix = cleanPhone.slice(-8);
            const { data } = await supabaseAdmin
                .from('appointments')
                .select('*')
                .ilike('phone', `%${phoneSuffix}%`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data && data.length > 0) candidates = data;
        }

        // ── Strategy 2: Car make + model query ──
        if (candidates.length === 0 && (car_make || car_model)) {
            let query = supabaseAdmin
                .from('appointments')
                .select('*')
                .eq('matched', false);

            if (car_make) query = query.ilike('car_make', `%${car_make}%`);
            if (car_model) query = query.ilike('car_model', `%${car_model}%`);

            query = query.order('created_at', { ascending: false }).limit(20);
            const { data } = await query;

            if (data && data.length > 0) candidates = data;
        }

        // ── Strategy 3: Name-only fallback ──
        if (candidates.length === 0 && name) {
            const { data } = await supabaseAdmin
                .from('appointments')
                .select('*')
                .eq('matched', false)
                .ilike('full_name', `%${name}%`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data && data.length > 0) candidates = data;
        }

        // ── Score each candidate ──
        let bestMatch = null;
        let bestScore = 0;
        let matchedFields = [];

        for (const candidate of candidates) {
            let score = 0;
            const fields = [];

            // Car make match (+2)
            if (car_make && candidate.car_make &&
                candidate.car_make.toLowerCase().includes(car_make.toLowerCase())) {
                score += 2;
                fields.push('car_make');
            }

            // Car model match (+2)
            if (car_model && candidate.car_model &&
                candidate.car_model.toLowerCase().includes(car_model.toLowerCase())) {
                score += 2;
                fields.push('car_model');
            }

            // Car year match (+2 exact, +1 within 1 year)
            if (car_year && candidate.car_year) {
                const yearDiff = Math.abs(candidate.car_year - parseInt(car_year));
                if (yearDiff === 0) { score += 2; fields.push('car_year_exact'); }
                else if (yearDiff <= 1) { score += 1; fields.push('car_year_close'); }
            }

            // Name match (+2)
            if (name && candidate.full_name) {
                const nameLower = name.toLowerCase();
                const candidateName = candidate.full_name.toLowerCase();
                if (candidateName.includes(nameLower) || nameLower.includes(candidateName)) {
                    score += 2;
                    fields.push('name');
                } else {
                    // Partial name match (first or last name)
                    const nameParts = nameLower.split(/\s+/);
                    const candidateParts = candidateName.split(/\s+/);
                    const partialMatch = nameParts.some(p => candidateParts.some(cp => cp.includes(p) || p.includes(cp)));
                    if (partialMatch) { score += 1; fields.push('name_partial'); }
                }
            }

            // Mileage match (+1 within 5k, +2 within 2k)
            if (mileage && candidate.mileage) {
                const kmDiff = Math.abs(candidate.mileage - parseInt(mileage));
                if (kmDiff <= 2000) { score += 2; fields.push('mileage_close'); }
                else if (kmDiff <= 5000) { score += 1; fields.push('mileage_range'); }
            }

            // Phone match (+3 — strongest signal)
            if (phone && candidate.phone) {
                const cleanInput = phone.replace(/[\s\-\+]/g, '').slice(-8);
                const cleanCandidate = candidate.phone.replace(/[\s\-\+]/g, '').slice(-8);
                if (cleanInput === cleanCandidate) {
                    score += 3;
                    fields.push('phone');
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
                matchedFields = fields;
            }
        }

        // ── Determine confidence ──
        // high: 6+ points (e.g. make+model+year+name)
        // medium: 4-5 points (e.g. make+model+name_partial)
        // low: 2-3 points
        let confidence = 'none';
        if (bestScore >= 6) confidence = 'high';
        else if (bestScore >= 4) confidence = 'medium';
        else if (bestScore >= 2) confidence = 'low';

        // ── Link the match if confidence is medium or high ──
        if (bestMatch && funnel_lead_id && (confidence === 'high' || confidence === 'medium')) {
            await supabaseAdmin
                .from('appointments')
                .update({
                    matched: true,
                    matched_funnel_id: funnel_lead_id,
                    status: 'agendado'
                })
                .eq('id', bestMatch.id);

            bestMatch.matched = true;
            bestMatch.matched_funnel_id = funnel_lead_id;
        }

        return NextResponse.json({
            success: true,
            matched: bestMatch !== null && confidence !== 'none',
            confidence,
            score: bestScore,
            match_details: {
                fields_matched: matchedFields,
                candidates_evaluated: candidates.length
            },
            appointment: bestMatch,
            suggestions: !bestMatch
                ? 'No se encontró coincidencia. Verifica: nombre, marca, modelo, año o kilometraje del auto.'
                : undefined
        });

    } catch (err) {
        console.error('[Bridge API] Error:', err);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

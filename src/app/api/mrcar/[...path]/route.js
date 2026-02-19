import { NextResponse } from 'next/server';

const MRCAR_API_BASE = 'https://mrcar-cotizacion.vercel.app/api';

export async function GET(request, { params }) {
    const { path } = await params;
    const urlPath = path.join('/');
    const url = `${MRCAR_API_BASE}/${urlPath}`;

    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://mrcar-cotizacion.vercel.app',
                'Referer': 'https://mrcar-cotizacion.vercel.app/'
            },
        });

        const text = await res.text();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data, { status: res.status });
        } catch (jsonError) {
            console.error('[Proxy] JSON Parse Error:', jsonError);
            return NextResponse.json(
                { success: false, error: 'Invalid response from upstream server (not JSON)' },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error('[Proxy] Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Proxy Connection Failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { path } = await params;
    const urlPath = path.join('/');
    const url = `${MRCAR_API_BASE}/${urlPath}`;

    try {
        const body = await request.json();

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://mrcar-cotizacion.vercel.app',
                'Referer': 'https://mrcar-cotizacion.vercel.app/'
            },
            body: JSON.stringify(body),
        });

        const text = await res.text();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data, { status: res.status });
        } catch (jsonError) {
            console.error('[Proxy] POST JSON Parse Error:', jsonError);
            return NextResponse.json(
                { success: false, error: 'Invalid response from upstream server (not JSON)' },
                { status: 502 }
            );
        }
    } catch (error) {
        console.error('[Proxy] POST Error:', error);
        return NextResponse.json({ success: false, error: 'Proxy Connection Failed' }, { status: 500 });
    }
}

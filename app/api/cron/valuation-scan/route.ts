import { NextRequest, NextResponse } from 'next/server';
import { runValuationScan } from '@/lib/actions/valuation.actions';

/**
 * Daily valuation-screen batch.
 *
 * Optional companion to the page's traffic-triggered refresh: wire this into
 * the `feedcast-stocks-cron` Worker's daily schedule (same Bearer-token auth
 * as check-alerts) to rebuild the cheapest/priciest screen at a fixed time
 * instead of on first visit. Each call advances the scan by up to ~50 symbols
 * (Finnhub free-tier paced) and rebuilds the ranked lists from the cache, so
 * scheduling it a few times fills the whole universe.
 */
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return (request.headers.get('authorization') ?? '') === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const screen = await runValuationScan();
        return NextResponse.json({
            scanned: screen.scanned,
            universe: screen.universe,
            noEarnings: screen.noEarnings,
            asOf: screen.asOf,
        });
    } catch (err) {
        console.error('valuation-scan error', err);
        return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return handle(request);
}

export async function GET(request: NextRequest) {
    return handle(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Price-alert cron endpoint.
 *
 * Triggered every 5 minutes by the separate `feedcast-stocks-cron`
 * Worker (Cloudflare Cron Triggers), which POSTs here with a
 * `Authorization: Bearer ${CRON_SECRET}` header.
 *
 * Loads every alert that is still `active`, not yet `triggered` and not
 * expired, fetches the current Finnhub quote for each distinct symbol,
 * and flips `triggered = true` wherever the configured condition is met.
 */

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

type AlertRow = {
  id: number;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
};

type FinnhubQuote = { c?: number };

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

async function fetchQuote(symbol: string, token: string): Promise<number | null> {
  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as FinnhubQuote;
    return typeof data.c === 'number' && data.c > 0 ? data.c : null;
  } catch (err) {
    console.error('check-alerts: quote fetch failed for', symbol, err);
    return null;
  }
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: 'FINNHUB_API_KEY not configured' },
      { status: 500 }
    );
  }

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: alerts, error } = await admin
    .from('stock_alerts')
    .select('id, symbol, target_price, condition')
    .eq('active', true)
    .eq('triggered', false)
    .gt('expires_at', nowIso);

  if (error) {
    console.error('check-alerts: failed to load alerts', error);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }

  const rows = (alerts ?? []) as AlertRow[];
  if (rows.length === 0) {
    return NextResponse.json({ checked: 0, triggered: 0 });
  }

  // One quote per distinct symbol.
  const symbols = [...new Set(rows.map((a) => a.symbol.toUpperCase()))];
  const quoteEntries = await Promise.all(
    symbols.map(async (sym) => [sym, await fetchQuote(sym, token)] as const)
  );
  const quotes = new Map<string, number | null>(quoteEntries);

  const triggeredIds: number[] = [];
  for (const alert of rows) {
    const price = quotes.get(alert.symbol.toUpperCase());
    if (price == null) continue;

    const met =
      alert.condition === 'ABOVE'
        ? price >= alert.target_price
        : price <= alert.target_price;

    if (met) triggeredIds.push(alert.id);
  }

  if (triggeredIds.length > 0) {
    const { error: updateError } = await admin
      .from('stock_alerts')
      .update({ triggered: true, updated_at: new Date().toISOString() })
      .in('id', triggeredIds);

    if (updateError) {
      console.error('check-alerts: failed to mark triggered', updateError);
      return NextResponse.json(
        { error: 'Failed to update alerts' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    checked: rows.length,
    triggered: triggeredIds.length,
  });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Allow GET too — convenient for manual checks and matches the Feedcast
// cron-worker default verb.
export async function GET(request: NextRequest) {
  return handle(request);
}

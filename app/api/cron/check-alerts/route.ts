import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isFeedcastEmailConfigured, sendStockAlertEmail } from '@/lib/email/feedcast';

/**
 * Price-alert cron endpoint.
 *
 * Triggered every 5 minutes by the separate `feedcast-stocks-cron`
 * Worker (Cloudflare Cron Triggers), which POSTs here with a
 * `Authorization: Bearer ${CRON_SECRET}` header.
 *
 * 1. Loads every alert that is still `active`, not yet `triggered` and not
 *    expired, fetches the current Finnhub quote for each distinct symbol,
 *    and flips `triggered = true` wherever the configured condition is met.
 * 2. Emails the owner of each triggered-but-not-yet-notified alert via the
 *    Feedcast email service, stamping `notified_at` only on success so a
 *    failed send retries next run and nobody is emailed twice.
 */

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const WATCHLIST_URL = 'https://markets.feedcast.news/watchlist';

type AlertRow = {
  id: number;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
};

type PendingAlertRow = {
  id: number;
  user_id: string;
  symbol: string;
  name: string | null;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
};

type FinnhubQuote = { c?: number };

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function conditionText(condition: 'ABOVE' | 'BELOW'): string {
  return condition === 'ABOVE' ? 'rose to or above' : 'fell to or below';
}

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

/**
 * Emails the owner of every triggered alert that hasn't been notified yet.
 * Picks up both alerts triggered in this run and any whose send failed
 * previously. Stamps `notified_at` only for successful sends. Returns the
 * number of emails sent.
 */
async function notifyTriggeredAlerts(
  admin: SupabaseClient,
  token: string
): Promise<number> {
  if (!isFeedcastEmailConfigured()) return 0;

  const { data, error } = await admin
    .from('stock_alerts')
    .select('id, user_id, symbol, name, target_price, condition')
    .eq('triggered', true)
    .eq('active', true)
    .is('notified_at', null)
    .limit(100);

  if (error) {
    console.error('check-alerts: failed to load pending notifications', error);
    return 0;
  }

  const pending = (data ?? []) as PendingAlertRow[];
  if (pending.length === 0) return 0;

  // One quote per distinct symbol, reused across alerts on that symbol.
  const symbols = [...new Set(pending.map((a) => a.symbol.toUpperCase()))];
  const quoteEntries = await Promise.all(
    symbols.map(async (sym) => [sym, await fetchQuote(sym, token)] as const)
  );
  const quotes = new Map<string, number | null>(quoteEntries);

  const notifiedIds: number[] = [];
  for (const alert of pending) {
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(alert.user_id);
    const email = userData?.user?.email;
    if (userError || !email) {
      console.error('check-alerts: could not resolve email for alert', alert.id, userError);
      continue;
    }

    const symbolUpper = alert.symbol.toUpperCase();
    const price = quotes.get(symbolUpper);

    const sent = await sendStockAlertEmail({
      to: email,
      symbol: symbolUpper,
      alertName: alert.name?.trim() || `${symbolUpper} price alert`,
      conditionText: conditionText(alert.condition),
      targetPrice: formatUsd(alert.target_price),
      currentPrice: price != null ? formatUsd(price) : 'the target',
      watchlistUrl: WATCHLIST_URL,
    });

    if (sent) notifiedIds.push(alert.id);
  }

  if (notifiedIds.length > 0) {
    const { error: stampError } = await admin
      .from('stock_alerts')
      .update({ notified_at: new Date().toISOString() })
      .in('id', notifiedIds);
    if (stampError) {
      // Emails already went out; log so a retry doesn't silently double-send.
      console.error('check-alerts: failed to stamp notified_at', stampError);
    }
  }

  return notifiedIds.length;
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
  const triggeredIds: number[] = [];

  if (rows.length > 0) {
    // One quote per distinct symbol.
    const symbols = [...new Set(rows.map((a) => a.symbol.toUpperCase()))];
    const quoteEntries = await Promise.all(
      symbols.map(async (sym) => [sym, await fetchQuote(sym, token)] as const)
    );
    const quotes = new Map<string, number | null>(quoteEntries);

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
  }

  // Email owners of any triggered-but-unnotified alerts (this run + retries).
  const notified = await notifyTriggeredAlerts(admin, token);

  return NextResponse.json({
    checked: rows.length,
    triggered: triggeredIds.length,
    notified,
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

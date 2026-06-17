import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isFeedcastEmailConfigured, sendStockAlertEmail } from '@/lib/email/feedcast';
import { getValuationScreen, runValuationScan } from '@/lib/actions/valuation.actions';
import { currentSession } from '@/lib/valuation';

/**
 * Rebuild the valuation screen once per trading session. This 5-minute cron is
 * the reliable driver (a worker request that runs to completion, unlike a
 * page's best-effort background task): right after each US close the session
 * flips, the stored screen is no longer "complete", and the next few ticks
 * refill it a chunk at a time. Idempotent and cheap once built. Returns how
 * many names are scored, or -1 when no work was needed.
 */
async function rebuildValuationIfNeeded(): Promise<number> {
    try {
        const session = currentSession();
        const screen = await getValuationScreen();
        if (screen && screen.session === session && screen.complete) return -1;
        const next = await runValuationScan();
        return next?.scanned ?? -1;
    } catch (err) {
        console.error('check-alerts: valuation rebuild failed', err);
        return -1;
    }
}

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
const WATCHLIST_URL = 'https://stocks.feedcast.news/watchlist';

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

// Bounded-concurrency map — Finnhub free tier 429s on large parallel bursts,
// and auth.admin lookups shouldn't hammer Supabase either.
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
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
  const quoteEntries = await mapWithLimit(
    symbols,
    4,
    async (sym) => [sym, await fetchQuote(sym, token)] as const
  );
  const quotes = new Map<string, number | null>(quoteEntries);

  // One auth lookup per distinct owner (not per alert) — a user with many
  // triggered alerts previously cost one admin API call each.
  const userIds = [...new Set(pending.map((a) => a.user_id))];
  const emailEntries = await mapWithLimit(userIds, 4, async (userId) => {
    try {
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError) throw userError;
      return [userId, userData?.user?.email ?? null] as const;
    } catch (err) {
      console.error('check-alerts: could not resolve email for user', userId, err);
      return [userId, null] as const;
    }
  });
  const emails = new Map<string, string | null>(emailEntries);

  const notifiedIds: number[] = [];
  for (const alert of pending) {
    const email = emails.get(alert.user_id);
    if (!email) continue;

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

  // Page through alerts (instead of one unbounded select) so a growing table
  // can't blow the memory/CPU budget of a single cron run. Quotes are fetched
  // once per distinct symbol with bounded concurrency and reused across pages.
  const PAGE_SIZE = 500;
  const quotes = new Map<string, number | null>();
  const triggeredIds: number[] = [];
  let checked = 0;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data: alerts, error } = await admin
      .from('stock_alerts')
      .select('id, symbol, target_price, condition')
      .eq('active', true)
      .eq('triggered', false)
      .gt('expires_at', nowIso)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('check-alerts: failed to load alerts', error);
      return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
    }

    const rows = (alerts ?? []) as AlertRow[];
    if (rows.length === 0) break;
    checked += rows.length;

    const newSymbols = [...new Set(rows.map((a) => a.symbol.toUpperCase()))].filter(
      (sym) => !quotes.has(sym)
    );
    const quoteEntries = await mapWithLimit(
      newSymbols,
      4,
      async (sym) => [sym, await fetchQuote(sym, token)] as const
    );
    for (const [sym, price] of quoteEntries) quotes.set(sym, price);

    for (const alert of rows) {
      const price = quotes.get(alert.symbol.toUpperCase());
      if (price == null) continue;

      const met =
        alert.condition === 'ABOVE'
          ? price >= alert.target_price
          : price <= alert.target_price;

      if (met) triggeredIds.push(alert.id);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  if (triggeredIds.length > 0) {
    // Chunk the IN() update so a big trigger wave stays within statement limits.
    for (let i = 0; i < triggeredIds.length; i += PAGE_SIZE) {
      const chunk = triggeredIds.slice(i, i + PAGE_SIZE);
      const { error: updateError } = await admin
        .from('stock_alerts')
        .update({ triggered: true, updated_at: new Date().toISOString() })
        .in('id', chunk);

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

  // Rebuild the valuation screen once per session (after each close).
  const valuationScored = await rebuildValuationIfNeeded();

  return NextResponse.json({
    checked,
    triggered: triggeredIds.length,
    notified,
    valuationScored,
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

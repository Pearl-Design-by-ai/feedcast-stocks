'use server';

import { kvCachedJSON } from '@/lib/market-cache';
import { enginePost } from '@/lib/engine-client';

/**
 * Multi-period total-return approximations from 2y of adjusted daily closes.
 *
 * Source of truth is the private markets-engine's `/v1/closes` seam: it fetches
 * Yahoo once per symbol behind a shared KV cache (and retries across Yahoo's two
 * edge hosts), so a 20-symbol watchlist no longer makes every public-app isolate
 * burst Yahoo directly and 429 — the symptom that left the enrichment columns
 * blank ("—"). Direct Yahoo stays only as a last-resort fallback when the engine
 * is unconfigured/unreachable. We strip the exchange prefix and cache 6h (EOD).
 * Best-effort — any failure yields nulls.
 */

type CloseSeries = Array<{ date: string; close: number }>;

/** One round-trip to the engine for many symbols' 2y closes; {} on any miss. */
async function fetchClosesFromEngine(symbols: string[]): Promise<Record<string, CloseSeries>> {
    if (symbols.length === 0) return {};
    const res = await enginePost<{ closes?: Record<string, CloseSeries> }>(
        '/v1/closes',
        { symbols },
        {}
    );
    return res?.closes ?? {};
}

export interface SymbolReturns {
    symbol: string;
    w1: number | null;
    m1: number | null;
    m3: number | null;
    ytd: number | null;
    y1: number | null;
}

function tickerOf(symbol: string): string {
    return (symbol.split(':').pop() ?? symbol).trim().toUpperCase();
}

export async function fetchDailyCloses(
    symbol: string
): Promise<Array<{ date: string; close: number }>> {
    const t = tickerOf(symbol);
    // Cross-isolate KV cache — fetch revalidate hints are per-isolate no-ops on
    // Workers, so without this every fresh isolate re-downloads 2y of history
    // per symbol (the main cost of the enriched watchlist). Empty results are
    // returned as null inside the cache helper so a Yahoo/engine blip isn't cached.
    const cached = await kvCachedJSON<Array<{ date: string; close: number }> | null>(
        `yh:${t}`,
        21600,
        async () => {
            // Engine seam first (its own cache + Yahoo retry); direct Yahoo only
            // if the engine returned nothing.
            const fromEngine = (await fetchClosesFromEngine([t]))[t];
            if (fromEngine && fromEngine.length > 0) return fromEngine;
            const out = await fetchDailyClosesUncached(t);
            return out.length > 0 ? out : null;
        }
    );
    return cached ?? [];
}

/**
 * Batch 2y closes for a watchlist in a single engine round-trip, falling back to
 * the per-symbol path (public KV → engine[1] → Yahoo) for anything the batch
 * missed. Keyed by the stripped ticker. Used by the enriched watchlist so it
 * doesn't fire one engine call per symbol on a cold public-KV isolate.
 */
export async function fetchDailyClosesMap(
    symbols: string[]
): Promise<Map<string, CloseSeries>> {
    const out = new Map<string, CloseSeries>();
    const tickers = [...new Set(symbols.map(tickerOf).filter(Boolean))];
    if (tickers.length === 0) return out;

    const batch = await fetchClosesFromEngine(tickers);
    const misses: string[] = [];
    for (const t of tickers) {
        const series = batch[t];
        if (series && series.length > 0) out.set(t, series);
        else misses.push(t);
    }

    // Anything the engine batch didn't cover: resolve individually (this also
    // warms the per-symbol public KV cache for later single-symbol reads).
    await Promise.all(
        misses.map(async (t) => {
            const series = await fetchDailyCloses(t);
            if (series.length > 0) out.set(t, series);
        })
    );

    return out;
}

/**
 * Longer-history daily closes (e.g. 5y) for multi-year backtests. Cached 24h
 * under a range-specific key so it doesn't collide with the 2y series.
 */
export async function fetchClosesRange(
    symbol: string,
    range = '5y'
): Promise<Array<{ date: string; close: number }>> {
    const t = tickerOf(symbol);
    const cached = await kvCachedJSON<Array<{ date: string; close: number }> | null>(
        `yh:${range}:${t}`,
        86400,
        async () => {
            const out = await fetchDailyClosesUncached(t, range);
            return out.length > 0 ? out : null;
        }
    );
    return cached ?? [];
}

async function fetchDailyClosesUncached(
    t: string,
    range = '2y'
): Promise<Array<{ date: string; close: number }>> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=${range}&interval=1d`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 21600 },
        });
        if (!res.ok) return [];
        const json = (await res.json()) as {
            chart?: {
                result?: Array<{
                    timestamp?: number[];
                    indicators?: {
                        quote?: Array<{ close?: Array<number | null> }>;
                        adjclose?: Array<{ adjclose?: Array<number | null> }>;
                    };
                }>;
            };
        };
        const r = json.chart?.result?.[0];
        const ts = r?.timestamp ?? [];
        const closes = r?.indicators?.adjclose?.[0]?.adjclose ?? r?.indicators?.quote?.[0]?.close ?? [];
        const out: Array<{ date: string; close: number }> = [];
        for (let i = 0; i < ts.length; i++) {
            const c = closes[i];
            if (c == null || !Number.isFinite(c)) continue;
            out.push({ date: new Date(ts[i] * 1000).toISOString().slice(0, 10), close: c });
        }
        return out;
    } catch {
        return [];
    }
}

function pct(latest: number, past: number | undefined): number | null {
    return past && past > 0 ? (latest / past - 1) * 100 : null;
}

export async function getReturns(symbols: string[]): Promise<SymbolReturns[]> {
    const year = new Date().getFullYear();
    return Promise.all(
        symbols.map(async (symbol): Promise<SymbolReturns> => {
            try {
                const closes = await fetchDailyCloses(symbol);
                if (closes.length < 2) return { symbol, w1: null, m1: null, m3: null, ytd: null, y1: null };
                const n = closes.length;
                const latest = closes[n - 1].close;
                const at = (back: number) => (n - 1 - back >= 0 ? closes[n - 1 - back].close : undefined);
                const firstOfYear = closes.find((c) => c.date.startsWith(`${year}-`))?.close;
                return {
                    symbol,
                    w1: pct(latest, at(5)),
                    m1: pct(latest, at(21)),
                    m3: pct(latest, at(63)),
                    ytd: pct(latest, firstOfYear),
                    y1: pct(latest, at(252)),
                };
            } catch {
                return { symbol, w1: null, m1: null, m3: null, ytd: null, y1: null };
            }
        })
    );
}

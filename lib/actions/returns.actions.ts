'use server';

import { kvCachedJSON } from '@/lib/market-cache';

/**
 * Multi-period total-return approximations from Yahoo Finance's free chart API.
 * (We used to read Stooq's CSV, but stooq.com now serves a JS proof-of-work
 * anti-bot wall that server-side fetch can't clear.) We strip the exchange
 * prefix, request 2y of adjusted daily closes, and compute returns from them.
 * Cached 6h (EOD data). Best-effort — any failure yields nulls.
 */

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
    // returned as null inside the cache helper so a Yahoo blip isn't cached.
    const cached = await kvCachedJSON<Array<{ date: string; close: number }> | null>(
        `yh:${t}`,
        21600,
        async () => {
            const out = await fetchDailyClosesUncached(t);
            return out.length > 0 ? out : null;
        }
    );
    return cached ?? [];
}

async function fetchDailyClosesUncached(
    t: string
): Promise<Array<{ date: string; close: number }>> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=2y&interval=1d`;
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

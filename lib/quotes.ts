// Bounded quote-map fetch shared by server components (e.g. the dashboard
// watchlist tile). Same cached Finnhub getQuote the rest of the app uses; the
// worker pool caps concurrency at 4 so a long symbol list never bursts past
// the free-tier rate limit (mirrors getWatchlistData).

import { getQuote } from '@/lib/actions/finnhub.actions';

export interface QuoteEntry {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export async function getQuoteMap(symbols: string[]): Promise<Map<string, QuoteEntry>> {
    const out = new Map<string, QuoteEntry>();
    if (symbols.length === 0) return out;

    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            const quote = await getQuote(sym);
            if (quote?.c) {
                out.set(sym, {
                    symbol: sym,
                    price: quote.c,
                    change: quote.d ?? 0,
                    changePercent: quote.dp ?? 0,
                });
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, symbols.length) }, worker));
    return out;
}

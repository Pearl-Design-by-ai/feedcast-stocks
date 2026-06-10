// Server-side data helpers for the /reports pages. Quotes come from the same
// cached Finnhub getQuote the rest of the app uses; the only addition is a
// bounded worker pool so a report that needs 16 symbols never bursts past the
// free-tier rate limit (mirrors getWatchlistData's cap of 4 in flight).

import { getQuote } from '@/lib/actions/finnhub.actions';

export interface ReportQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export async function getReportQuotes(symbols: string[]): Promise<Map<string, ReportQuote>> {
    const out = new Map<string, ReportQuote>();
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

/** "Wednesday, June 10, 2026 · 09:42 ET" — stamped when the report renders. */
export function reportTimestamp(): string {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
    }).format(now);
    const time = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/New_York',
    }).format(now);
    return `${date} · ${time} ET`;
}

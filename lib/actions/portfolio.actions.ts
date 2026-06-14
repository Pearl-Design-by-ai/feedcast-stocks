'use server';

import { getQuote } from '@/lib/actions/finnhub.actions';
import { sanitizeSymbols } from '@/lib/utils';

/**
 * Last prices for a basket, used by the Portfolio Lab to turn target weights
 * into approximate share counts. Bounded concurrency keeps us under the
 * Finnhub free-tier burst limit; CASH and unknowns come back null.
 */
export async function priceBasket(tickers: string[]): Promise<Record<string, number | null>> {
    const syms = sanitizeSymbols(tickers.filter((t) => t.toUpperCase() !== 'CASH'), 60);
    const out: Record<string, number | null> = {};
    let next = 0;
    async function worker() {
        while (next < syms.length) {
            const sym = syms[next++];
            try {
                const q = await getQuote(sym);
                out[sym] = q?.c ?? null;
            } catch {
                out[sym] = null;
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, syms.length) }, worker));
    return out;
}

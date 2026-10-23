import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { isTickerLike, sanitizeSymbols } from '@/lib/utils';

export const WARM_TOP_N = 50;
export const WARM_MAX_SYMBOLS = 100;

/**
 * Symbols the cron warm-up keeps hot: the top popular names first, then the
 * owner's watchlist — upper-cased, ticker-validated, deduped and capped.
 */
export function warmSymbols(owner: string[]): string[] {
    const all = [...POPULAR_STOCK_SYMBOLS.slice(0, WARM_TOP_N), ...sanitizeSymbols(owner)]
        .map((s) => s.trim().toUpperCase())
        .filter((s) => isTickerLike(s));
    return [...new Set(all)].slice(0, WARM_MAX_SYMBOLS);
}

/** Rotate the list so each 10-minute run starts somewhere new (cold passes cover everyone). */
export function rotateForRun<T>(items: T[], now: number): T[] {
    if (items.length === 0) return items;
    const offset = Math.floor(now / 600_000) % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
}

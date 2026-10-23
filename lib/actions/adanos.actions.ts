'use server';

import {
    buildStockSentimentInsights,
    normalizeSourceInsight,
    SOURCE_CONFIG,
    type SentimentSourceInsight,
    type SentimentSourceKey,
    type SourceComparePayload,
    type StockSentimentInsights,
} from './adanos.helpers';
import { isTickerLike } from '@/lib/utils';
import { swrCached } from '@/lib/swr-cache';

const DEFAULT_LOOKBACK_DAYS = 7;
const FETCH_TIMEOUT_MS = 5000;
/** Max wait for the stock page on a cold miss; the fetch completes in the background. */
const RENDER_TIMEOUT_MS = 2500;

/** `ok: false` = transport/upstream error (don't cache); `ok: true, insight: null` = no coverage. */
type SourceResult = { ok: boolean; insight: SentimentSourceInsight | null };

function getAdanosBaseUrl(): string {
    return (process.env.ADANOS_API_BASE_URL || 'https://api.adanos.org').replace(/\/$/, '');
}

function getAdanosApiKey(): string {
    return process.env.ADANOS_API_KEY ?? '';
}

async function fetchCompareSource(
    source: SentimentSourceKey,
    symbol: string,
    days: number,
): Promise<SourceResult> {
    try {
        const url = new URL(`${getAdanosBaseUrl()}${SOURCE_CONFIG[source].path}`);
        url.searchParams.set('tickers', symbol.toUpperCase());
        url.searchParams.set('days', String(days));

        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
        let response: Response;
        try {
            response = await fetch(url.toString(), {
                headers: {
                    'X-API-Key': getAdanosApiKey(),
                },
                signal: abortController.signal,
                next: { revalidate: 300 },
            });
        } finally {
            clearTimeout(timeout);
        }

        if (response.status === 404) {
            return { ok: true, insight: null };
        }

        if (!response.ok) {
            console.error(`Adanos ${source} compare failed for ${symbol}: ${response.status}`);
            return { ok: false, insight: null };
        }

        const payload = (await response.json()) as SourceComparePayload;
        const row = payload.stocks?.find((item) => item.ticker?.toUpperCase() === symbol.toUpperCase());

        return { ok: true, insight: normalizeSourceInsight(source, row) };
    } catch (error) {
        console.error(`Adanos ${source} compare request failed for ${symbol}`, error);
        return { ok: false, insight: null };
    }
}

export async function getStockSentimentInsights(
    symbol: string,
    days: number = DEFAULT_LOOKBACK_DAYS,
): Promise<StockSentimentInsights | null> {
    if (!getAdanosApiKey() || !symbol?.trim()) {
        return null;
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    // Ticker-shaped only — this comes straight from the /stocks/[symbol] route.
    if (!isTickerLike(normalizedSymbol)) return null;
    const lookbackDays = Math.max(1, Math.min(days, 30));

    // One page view = 4 Adanos calls; SWR-share the combined result so repeat
    // views of the same symbol (any user, any isolate) don't re-burn quota.
    // "No coverage" is cached too (as `insight: null`) — otherwise every view of
    // an uncovered ticker re-paid the full fan-out. Errors are never cached.
    const cached = await swrCached<{ complete: boolean; insight: StockSentimentInsights | null }>(
        `adanos:${normalizedSymbol}:${lookbackDays}`,
        { fresh: 300, timeoutMs: RENDER_TIMEOUT_MS, shouldCache: (v) => v.complete || v.insight !== null },
        async () => {
            const sourceKeys = Object.keys(SOURCE_CONFIG) as SentimentSourceKey[];
            const results = await Promise.all(
                sourceKeys.map((source) => fetchCompareSource(source, normalizedSymbol, lookbackDays)),
            );
            return {
                complete: results.every((r) => r.ok),
                insight: buildStockSentimentInsights(normalizedSymbol, results.map((r) => r.insight)),
            };
        },
    );
    return cached?.insight ?? null;
}

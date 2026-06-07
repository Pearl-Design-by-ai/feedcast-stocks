'use server';

/**
 * Sentiment / price divergence radar. Flags watchlist names where social
 * sentiment (Adanos) and recent price action disagree — a classic
 * potential-turning-point tell. Needs Adanos configured; otherwise returns null
 * so the UI can omit it.
 */

import { getStockSentimentInsights } from '@/lib/actions/adanos.actions';
import { fetchStooqCloses } from '@/lib/actions/returns.actions';

export interface DivergenceItem {
    symbol: string;
    kind: 'bullish' | 'bearish';
    priceChange: number; // 1-week %
    bullishPct: number | null;
}

function weekReturn(closes: number[]): number | null {
    const i = closes.length - 1 - 5;
    if (i < 0 || closes[i] <= 0) return null;
    return (closes[closes.length - 1] / closes[i] - 1) * 100;
}

export async function getSentimentDivergence(symbols: string[]): Promise<DivergenceItem[] | null> {
    if (!symbols.length) return null;

    let sentimentSeen = 0;
    const results = await Promise.all(
        symbols.slice(0, 20).map(async (symbol): Promise<DivergenceItem | null> => {
            try {
                const [sentiment, closesRaw] = await Promise.all([
                    getStockSentimentInsights(symbol).catch(() => null),
                    fetchStooqCloses(symbol).catch(() => []),
                ]);
                if (!sentiment) return null;
                sentimentSeen += 1;

                const pc = weekReturn(closesRaw.map((c) => c.close));
                if (pc == null) return null;

                const bull = sentiment.bullishAverage;
                const trends = sentiment.sources.map((s) => s.trend).filter(Boolean) as string[];
                const rising = trends.filter((t) => t === 'rising').length;
                const falling = trends.filter((t) => t === 'falling').length;

                const bullishSentiment = (bull != null && bull > 55) || (rising > falling && rising > 0);
                const bearishSentiment = (bull != null && bull < 45) || (falling > rising && falling > 0);

                if (pc < -1 && bullishSentiment) {
                    return { symbol, kind: 'bullish', priceChange: pc, bullishPct: bull };
                }
                if (pc > 1 && bearishSentiment) {
                    return { symbol, kind: 'bearish', priceChange: pc, bullishPct: bull };
                }
                return null;
            } catch {
                return null;
            }
        })
    );

    if (sentimentSeen === 0) return null; // Adanos unavailable → omit entirely
    return results.filter((r): r is DivergenceItem => r !== null);
}

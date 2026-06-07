'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The sentiment/price divergence scoring
 * (and the Adanos + price fetching it needs) runs in the closed engine. See
 * `lib/engine-client.ts`.
 */

import { enginePost } from '@/lib/engine-client';

export interface DivergenceItem {
    symbol: string;
    kind: 'bullish' | 'bearish';
    priceChange: number;
    bullishPct: number | null;
}

export async function getSentimentDivergence(symbols: string[]): Promise<DivergenceItem[] | null> {
    return enginePost<DivergenceItem[] | null>('/v1/divergence', { symbols }, null);
}

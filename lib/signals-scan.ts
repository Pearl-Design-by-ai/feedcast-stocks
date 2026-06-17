'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The Buy/Sell/Hold grading, instrument
 * set, projections and macro reads run in the closed engine, which fetches its
 * own EOD data. Returns null if the engine is unconfigured/unreachable so the
 * page degrades gracefully. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { IndexSignal, MacroRead, MarketTone } from '@/lib/signals';
import type { DrawdownStat, WhyUp } from '@/lib/market-history';

export interface SignalsReport {
    asOf: string;
    /** The most recent close date in the underlying EOD data (YYYY-MM-DD). */
    dataDate: string;
    indices: IndexSignal[];
    sectors: IndexSignal[];
    macro: MacroRead[];
    tone: MarketTone;
    /** Curated context served by the engine. */
    correctionStats: DrawdownStat[];
    whyMarketsRise: WhyUp[];
}

export async function getSignalsReport(): Promise<SignalsReport | null> {
    return engineGet<SignalsReport | null>('/v1/signals', {}, null);
}

'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The per-asset bubble/pop scoring and the
 * curated theme/candidate/historical catalogs run in the closed engine, which
 * fetches its own EOD data. Returns null if the engine is unconfigured/
 * unreachable so the page degrades gracefully. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type {
    AssetBubble,
    BubbleTheme,
    BubbleCandidate,
    HistoricalBubble,
    BubbleSource,
    Phase,
} from '@/lib/bubble';

export interface ThemeScan {
    theme: BubbleTheme;
    assets: AssetBubble[];
    avgBubble: number;
    avgPop: number;
}

export interface CandidateScan {
    candidate: BubbleCandidate;
    assets: AssetBubble[];
    avgBubble: number;
    avgPop: number;
}

export interface BubbleScan {
    themes: ThemeScan[];
    candidates: CandidateScan[];
    frothIndex: number;
    topPop: AssetBubble[];
    scored: number;
    universe: number;
    phaseCounts: Record<Phase, number>;
    asOf: string;
    /** Most recent close date in the underlying EOD data (YYYY-MM-DD). */
    dataDate: string;
    /** Curated context served by the engine. */
    sources: BubbleSource[];
    historical: HistoricalBubble[];
}

export async function runBubbleScan(): Promise<BubbleScan | null> {
    return engineGet<BubbleScan | null>('/v1/bubble', {}, null);
}

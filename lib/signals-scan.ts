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

export type AllocAction = 'add' | 'hold' | 'trim' | 'de-risk';

export interface AllocationStep {
    scenario: string;
    movePct: number | null;
    level: number | null;
    action: AllocAction;
    equityPct: number;
    cashPct: number;
    note: string;
}

export interface TacticalAllocation {
    anchor: string;
    anchorLevel: number | null;
    equityPct: number;
    cashPct: number;
    stance: string;
    tone: 'pos' | 'neutral' | 'neg';
    rationale: string;
    volNote: string;
    trendNote: string;
    ladder: AllocationStep[];
    disclaimer: string;
}

// Smart-money tracks (Polymarket odds, insider Form-4 flow, congress trades) —
// computed in the engine; the app only renders the result.
export type SmartState = 'bull' | 'neutral' | 'bear';

export interface SmartItem {
    label: string;
    value: string;
    tone: 'pos' | 'neutral' | 'neg';
}

export interface SmartTrack {
    key: 'polymarket' | 'insider' | 'congress';
    name: string;
    blurb: string;
    state: SmartState;
    score: number;
    headline: string;
    detail: string;
    items: SmartItem[];
}

export interface SmartMoney {
    tracks: SmartTrack[];
    /** Combined bounded tilt (−10…+10) already folded into the tactical call. */
    tilt: number;
    note: string;
}

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
    /** Engine-derived equity/cash tilt with a scenario ladder. */
    tactical: TacticalAllocation | null;
    /** Smart-money tracks — absent on older engine deployments. */
    smartMoney?: SmartMoney | null;
}

export async function getSignalsReport(): Promise<SignalsReport | null> {
    return engineGet<SignalsReport | null>('/v1/signals', {}, null);
}

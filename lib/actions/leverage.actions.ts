'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The leverage-appetite scoring, the
 * QQQ↔TQQQ / SPY↔SPXL pair set and the volatility blend run in the closed
 * engine, which fetches its own EOD data. Returns null if the engine is
 * unconfigured/unreachable so the page degrades gracefully. See
 * lib/engine-client.ts.
 */

import { engineGet, enginePost } from '@/lib/engine-client';
import type { LeverageReport, StressReport } from '@/lib/leverage';

export type LevRange = '6m' | 'ytd' | '1y' | 'max';
export type LevRebal = 'daily' | 'weekly';

export async function getLeverageReport(
    range: LevRange = 'ytd',
    rebal: LevRebal = 'daily',
    costBps = 3,
): Promise<LeverageReport | null> {
    return engineGet<LeverageReport | null>('/v1/leverage', { range, rebal, cost: String(costBps) }, null);
}

export interface StressScenarioInput {
    key?: string;
    label?: string;
    desc?: string;
    dropPct: number;
    dropDays: number;
    recoverPct: number;
    recoverDays: number;
    vix: number;
}

export async function getStressTest(
    range: LevRange,
    rebal: LevRebal,
    costBps: number,
    scenario: StressScenarioInput,
): Promise<StressReport | null> {
    return enginePost<StressReport | null>('/v1/leverage/stress', { range, rebal, cost: costBps, scenario }, null);
}

'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The leverage-appetite scoring, the
 * QQQ↔TQQQ / SPY↔SPXL pair set and the volatility blend run in the closed
 * engine, which fetches its own EOD data. Returns null if the engine is
 * unconfigured/unreachable so the page degrades gracefully. See
 * lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { LeverageReport } from '@/lib/leverage';

export async function getLeverageReport(): Promise<LeverageReport | null> {
    return engineGet<LeverageReport | null>('/v1/leverage', {}, null);
}

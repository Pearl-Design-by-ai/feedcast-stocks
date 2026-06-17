'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The curated Market Indicators catalog is
 * served by the engine; this forwards the request. Returns [] if the engine is
 * unconfigured/unreachable so the page renders empty rather than breaking. See
 * lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { IndicatorCategory } from '@/lib/market-indicators';

export async function getIndicatorCatalog(): Promise<IndicatorCategory[]> {
    return engineGet<IndicatorCategory[]>('/v1/indicators/catalog', {}, []);
}

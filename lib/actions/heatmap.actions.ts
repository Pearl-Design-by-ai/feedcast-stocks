'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The live heatmap (Finnhub quote fan-out
 * + sector grouping + caching) runs in the closed engine; this only forwards.
 */

import { engineGet } from '@/lib/engine-client';

export interface HeatmapStock {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  /** Optional market cap (USD). When present, used to size treemap tiles. */
  marketCap?: number | null;
}
export interface HeatmapData {
  asOf: string;
  sectors: { sector: string; stocks: HeatmapStock[] }[];
}

export async function getLiveHeatmap(): Promise<HeatmapData> {
  return engineGet<HeatmapData>('/v1/heatmap', {}, { asOf: '', sectors: [] });
}

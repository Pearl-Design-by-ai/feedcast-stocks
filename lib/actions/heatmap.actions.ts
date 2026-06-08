'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The live heatmap (Finnhub quote fan-out +
 * Yahoo EOD periods + caching) runs in the closed engine; this only forwards.
 */

import { engineGet } from '@/lib/engine-client';

export type HeatmapPeriod = 'd1' | 'w1' | 'm1' | 'ytd';

export interface HeatmapStock {
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  marketCap: number;
  d1: number | null;
  w1: number | null;
  m1: number | null;
  ytd: number | null;
}
export interface HeatmapData {
  asOf: string;
  stocks: HeatmapStock[];
}

export async function getLiveHeatmap(): Promise<HeatmapData> {
  return engineGet<HeatmapData>('/v1/heatmap', {}, { asOf: '', stocks: [] });
}

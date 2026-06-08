'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The live heatmap (Finnhub quote fan-out
 * + sector grouping + caching) runs in the closed engine; this only forwards.
 */

import { engineGet } from '@/lib/engine-client';
import { getQuote } from '@/lib/actions/finnhub.actions';

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

export interface HeatmapQuoteFill {
  price: number | null;
  changePct: number | null;
}

/**
 * Gap-fill for the heatmap: the engine's quote fan-out can be throttled by
 * Finnhub and return `changePct: null` for a rotating subset of symbols. This
 * fetches just those missing symbols directly via the shared, cached `getQuote`
 * (30s TTL + in-flight dedup), so blank tiles fill in on the next tick.
 *
 * Capped to bound the per-minute Finnhub fan-out from the public app.
 */
export async function getHeatmapQuoteFill(
  symbols: string[]
): Promise<Record<string, HeatmapQuoteFill>> {
  if (!symbols || symbols.length === 0) return {};
  const capped = symbols.slice(0, 40);
  const entries = await Promise.all(
    capped.map(async (sym) => {
      const q = await getQuote(sym);
      const price = typeof q?.c === 'number' && q.c > 0 ? q.c : null;
      const changePct = typeof q?.dp === 'number' && Number.isFinite(q.dp) ? q.dp : null;
      return [sym, { price, changePct }] as const;
    })
  );
  // Drop symbols Finnhub had nothing for, so the client only merges real fills.
  return Object.fromEntries(entries.filter(([, v]) => v.price != null || v.changePct != null));
}

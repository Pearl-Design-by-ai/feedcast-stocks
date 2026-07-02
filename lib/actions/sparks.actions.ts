'use server';

/**
 * Sparkline series — the last ~30 daily closes per symbol, for the tiny inline
 * charts on the signals page. One engine round-trip for the whole symbol set
 * (`/v1/closes`, engine-side KV-cached), trimmed to what a 100px SVG needs and
 * KV-cached 6h app-side. Best-effort: {} when the engine is unreachable.
 */

import { kvCachedJSON, fnv1a } from '@/lib/market-cache';
import { enginePost } from '@/lib/engine-client';

type CloseSeries = Array<{ date: string; close: number }>;

const POINTS = 30;

export async function getSparks(symbols: string[]): Promise<Record<string, number[]>> {
    if (symbols.length === 0) return {};
    const key = `sparks:v1:${fnv1a(symbols.slice().sort().join(','))}`;
    return kvCachedJSON(key, 6 * 3600, async () => {
        const res = await enginePost<{ closes?: Record<string, CloseSeries> }>('/v1/closes', { symbols }, {});
        const out: Record<string, number[]> = {};
        for (const [sym, series] of Object.entries(res?.closes ?? {})) {
            const closes = series.map((c) => c.close).slice(-POINTS);
            if (closes.length >= 10) out[sym] = closes;
        }
        return out;
    });
}

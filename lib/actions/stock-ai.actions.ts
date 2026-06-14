'use server';

/**
 * Per-stock AI helper built on the existing private engine (/v1/ask):
 * getPerformanceNote — a cached "why it's moved this year" explainer grounded
 * with the symbol's own return data.
 */

import { enginePost } from '@/lib/engine-client';
import { kvCachedJSON } from '@/lib/market-cache';
import { getReturns } from '@/lib/actions/returns.actions';
import { isTickerLike } from '@/lib/utils';
import { currentSession } from '@/lib/valuation';
import type { AskResult } from '@/lib/actions/ask.actions';

const pct = (v: number | null | undefined) =>
    v == null ? 'n/a' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

export interface PerformanceNote {
    text: string;
    ytd: number | null;
}

/**
 * Cached explanation of the stock's year-to-date move. One engine call per
 * symbol per trading session (then served from KV), so it doesn't burn engine
 * capacity on every page view.
 */
export async function getPerformanceNote(symbol: string, name: string): Promise<PerformanceNote | null> {
    if (!isTickerLike(symbol)) return null;
    const sym = symbol.toUpperCase();
    const session = currentSession();
    return kvCachedJSON<PerformanceNote | null>(`perfnote:${sym}:${session}`, 43_200, async () => {
        let ytd: number | null = null;
        let perf = '';
        try {
            const [r] = await getReturns([sym]);
            ytd = r?.ytd ?? null;
            perf = `YTD ${pct(r?.ytd)}, 1-month ${pct(r?.m1)}, 3-month ${pct(r?.m3)}, 1-year ${pct(r?.y1)}`;
        } catch {
            /* returns optional */
        }
        const prompt =
            `In 3–4 sentences, explain the main drivers behind ${name} (${sym})'s stock performance so far this year. ` +
            `Its price returns are: ${perf || 'not available'}. ` +
            `Point to concrete, likely catalysts — earnings results and guidance, demand or product trends, sector moves, regulation or macro — and note whether sentiment is improving or deteriorating. ` +
            `Be specific and balanced. This is informational, not investment advice.`;
        const res = await enginePost<AskResult>(
            '/v1/ask',
            { messages: [{ role: 'user', content: prompt }] },
            { ok: false, error: '' },
            30_000
        );
        if (res.ok && res.answer?.trim()) return { text: res.answer.trim(), ytd };
        return null; // null is never cached, so a blip retries next view
    });
}

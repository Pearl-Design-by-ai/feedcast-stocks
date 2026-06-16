'use server';

/**
 * Fetch EOD closes for the major US indices, the 11 SPDR sectors and the macro
 * backdrop (VIX, 10y yield, dollar, gold), and compute their Buy/Sell/Hold
 * signals in one pass. Each series is KV-cached 6h via fetchDailyCloses; a
 * failed symbol simply drops out. Powers the (power-user) Buy & Sell Signals page.
 */

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { currentSession } from '@/lib/valuation';
import {
    SIGNAL_INDICES,
    SECTOR_ETFS,
    MACRO_SERIES,
    computeIndexSignal,
    computeMacro,
    marketTone,
    type IndexSignal,
    type MacroRead,
} from '@/lib/signals';

export interface SignalsReport {
    asOf: string;
    /** The most recent close date in the underlying EOD data (YYYY-MM-DD). */
    dataDate: string;
    indices: IndexSignal[];
    sectors: IndexSignal[];
    macro: MacroRead[];
    tone: ReturnType<typeof marketTone>;
}

/**
 * Load closes through the last *completed* session. Yahoo's daily feed includes
 * today's still-forming bar during market hours, so we trim anything dated after
 * `session` (the most recent completed US session) — the indicators are EOD and
 * should read off the prior close, not an intraday partial.
 */
async function loadCloses(symbols: string[], session: string): Promise<{ closes: Map<string, number[]>; dataDate: string }> {
    const closes = new Map<string, number[]>();
    let dataDate = '';
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            try {
                const series = (await fetchDailyCloses(sym)).filter((c) => c.date <= session);
                if (series.length > 0) {
                    closes.set(sym, series.map((c) => c.close));
                    const d = series[series.length - 1].date;
                    if (d > dataDate) dataDate = d; // ISO dates sort lexically
                }
            } catch {
                /* drop this symbol */
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return { closes, dataDate };
}

export async function getSignalsReport(): Promise<SignalsReport> {
    const allSymbols = [
        ...SIGNAL_INDICES.map((d) => d.symbol),
        ...SECTOR_ETFS.map((d) => d.symbol),
        ...MACRO_SERIES.map((d) => d.symbol),
    ];
    const { closes: data, dataDate } = await loadCloses(allSymbols, currentSession());

    const indices = SIGNAL_INDICES
        .map((d) => { const c = data.get(d.symbol); return c ? computeIndexSignal(d, c) : null; })
        .filter((s): s is IndexSignal => s != null);

    const sectors = SECTOR_ETFS
        .map((d) => { const c = data.get(d.symbol); return c ? computeIndexSignal(d, c) : null; })
        .filter((s): s is IndexSignal => s != null)
        .sort((a, b) => b.score - a.score);

    const macro = MACRO_SERIES
        .map((d) => { const c = data.get(d.symbol); return c ? computeMacro(d, c) : null; })
        .filter((m): m is MacroRead => m != null);

    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }).format(new Date());

    return { asOf, dataDate, indices, sectors, macro, tone: marketTone(indices) };
}

'use server';

/**
 * Fetch EOD closes for the major US indices, the 11 SPDR sectors and the macro
 * backdrop (VIX, 10y yield, dollar, gold), and compute their Buy/Sell/Hold
 * signals in one pass. Each series is KV-cached 6h via fetchDailyCloses; a
 * failed symbol simply drops out. Powers the (power-user) Buy & Sell Signals page.
 */

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
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
    indices: IndexSignal[];
    sectors: IndexSignal[];
    macro: MacroRead[];
    tone: ReturnType<typeof marketTone>;
}

async function loadCloses(symbols: string[]): Promise<Map<string, number[]>> {
    const out = new Map<string, number[]>();
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            try {
                const series = await fetchDailyCloses(sym);
                if (series.length > 0) out.set(sym, series.map((c) => c.close));
            } catch {
                /* drop this symbol */
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return out;
}

export async function getSignalsReport(): Promise<SignalsReport> {
    const allSymbols = [
        ...SIGNAL_INDICES.map((d) => d.symbol),
        ...SECTOR_ETFS.map((d) => d.symbol),
        ...MACRO_SERIES.map((d) => d.symbol),
    ];
    const data = await loadCloses(allSymbols);

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

    return { asOf, indices, sectors, macro, tone: marketTone(indices) };
}

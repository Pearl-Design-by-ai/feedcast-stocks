'use server';

/**
 * Fetch EOD closes for the four major US indices and compute their Buy/Sell/Hold
 * signals. Each series is KV-cached 6h via fetchDailyCloses; a failed symbol
 * simply drops out. Powers the (power-user) Buy & Sell Signals page.
 */

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { SIGNAL_INDICES, computeIndexSignal, marketTone, type IndexSignal } from '@/lib/signals';

export interface SignalsReport {
    asOf: string;
    signals: IndexSignal[];
    tone: ReturnType<typeof marketTone>;
}

export async function getIndexSignals(): Promise<SignalsReport> {
    const results = await Promise.all(
        SIGNAL_INDICES.map(async (def) => {
            try {
                const series = await fetchDailyCloses(def.symbol);
                return computeIndexSignal(def, series.map((c) => c.close));
            } catch {
                return null;
            }
        })
    );
    const signals = results.filter((s): s is IndexSignal => s != null);
    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }).format(new Date());
    return { asOf, signals, tone: marketTone(signals) };
}

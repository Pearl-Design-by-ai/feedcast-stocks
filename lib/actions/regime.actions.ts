'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The market-regime signal math and
 * narration run in the closed engine, which fetches its own market data so the
 * instrument set never appears here. See `lib/engine-client.ts`.
 */

import { engineGet } from '@/lib/engine-client';

export type SignalState = 'on' | 'neutral' | 'off';

export interface RegimeSignal {
    label: string;
    state: SignalState;
    detail: string;
}

export interface MarketRegime {
    verdict: 'Risk-On' | 'Neutral' | 'Risk-Off' | 'Stress';
    score: number;
    signals: RegimeSignal[];
    narrative: string | null;
    asOf: string;
}

export async function getMarketRegime(): Promise<MarketRegime | null> {
    return engineGet<MarketRegime | null>('/v1/market/regime', {}, null);
}

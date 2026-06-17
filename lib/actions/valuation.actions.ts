'use server';

/**
 * Proxy shims → PRIVATE markets-engine. The curated universe, the P/E ranking
 * and the KV-backed daily scan run in the closed engine, which keeps the screen
 * fresh via its own cron. The public reads it here; the public cron routes can
 * also poke the engine to advance a scan chunk. See lib/engine-client.ts.
 */

import { engineGet, enginePost } from '@/lib/engine-client';
import type { ValuationScreen } from '@/lib/valuation';

/** Current stored screen, or null before the first engine run / when unreachable. */
export async function getValuationScreen(): Promise<ValuationScreen | null> {
    return engineGet<ValuationScreen | null>('/v1/valuation/screen', {}, null);
}

/**
 * The engine's own cron keeps the screen fresh, so reading is enough. Returns
 * whatever is currently stored (may be partial or null).
 */
export async function ensureFreshScreen(): Promise<ValuationScreen | null> {
    return getValuationScreen();
}

/** Advance the engine's valuation scan by one chunk (used by the public crons). */
export async function runValuationScan(): Promise<ValuationScreen | null> {
    return enginePost<ValuationScreen | null>('/v1/valuation/scan', {}, null);
}

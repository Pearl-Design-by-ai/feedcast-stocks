'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The Crash Detector's live scan, scoring
 * and curated overlay run in the closed engine, which fetches its own EOD data
 * so the instrument set never appears here. Returns null if the engine is
 * unconfigured/unreachable, so the page degrades gracefully. See
 * lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { CrashReport } from '@/lib/crash';

export async function runCrashScan(): Promise<CrashReport | null> {
    return engineGet<CrashReport | null>('/v1/crash', {}, null);
}

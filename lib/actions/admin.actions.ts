'use server';

/**
 * Proxy shim → PRIVATE markets-engine diagnostics. The upstream-feed probes,
 * EOD freshness checks and cron-progress reads run in the closed engine; this
 * just relays the report to the power-user Admin console. Uncached (engine-client
 * only caches the listed /v1 prefixes) so each load reflects live feed state.
 * Returns null if the engine is unconfigured/unreachable. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { DiagnosticsReport } from '@/lib/admin';

export async function getDiagnostics(): Promise<DiagnosticsReport | null> {
    return engineGet<DiagnosticsReport | null>('/v1/admin/diagnostics', {}, null);
}

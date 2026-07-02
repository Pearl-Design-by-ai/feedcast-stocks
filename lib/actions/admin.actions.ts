'use server';

/**
 * Proxy shim → PRIVATE markets-engine diagnostics. The upstream-feed probes,
 * EOD freshness checks and cron-progress reads run in the closed engine; this
 * just relays the report to the power-user Admin console. Uncached (engine-client
 * only caches the listed /v1 prefixes) so each load reflects live feed state.
 * Returns null if the engine is unconfigured/unreachable. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import { isPowerUserEmail } from '@/lib/constants';
import { getCurrentUser } from '@/lib/supabase/server';
import type { DiagnosticsReport } from '@/lib/admin';

export async function getDiagnostics(): Promise<DiagnosticsReport | null> {
    // Power-user only. The page gates with notFound(), but the action is a
    // callable endpoint on its own — enforce authz here at the trust boundary,
    // or any member could read internal feed/secret-wiring diagnostics directly.
    if (!isPowerUserEmail((await getCurrentUser())?.email)) return null;
    return engineGet<DiagnosticsReport | null>('/v1/admin/diagnostics', {}, null);
}

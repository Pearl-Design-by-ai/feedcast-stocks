/**
 * Tape-aware aura — a barely-there radial wash at the top of a page that
 * carries the day's Risk-On / Mixed / Risk-Off tone (from the cached signals
 * report). Felt before it's read; renders nothing if the engine is away.
 * Parent must be `relative`; wrap in <Suspense fallback={null}> so it streams.
 */

import { cn } from '@/lib/utils';
import { getSignalsReport } from '@/lib/signals-scan';

export default async function ToneAura() {
    const r = await getSignalsReport();
    if (!r) return null;
    const cls =
        r.tone.tone === 'pos' ? 'fc-aura-pos'
        : r.tone.tone === 'neg' ? 'fc-aura-neg'
        : 'fc-aura-neutral';
    return <div className={cn('fc-aura', cls)} aria-hidden="true" />;
}

/**
 * Per-visitor_hash rate limit for the page-view collector: at most
 * RATE_LIMIT_PER_HOUR events per hash per hour; the excess is dropped silently.
 *
 * Two layers: a per-isolate in-memory window (free, catches bursts hitting one
 * isolate) and the authoritative DB count over the last hour, which uses the
 * (visitor_hash, created_at) index. Both are best-effort — the cap is an abuse
 * guard, not billing.
 */

export const RATE_LIMIT_PER_HOUR = 120;
const HOUR_MS = 60 * 60 * 1000;

/** True when `countLastHour` existing events already fill the hourly budget. */
export function overHourlyLimit(countLastHour: number, limit = RATE_LIMIT_PER_HOUR): boolean {
    return countLastHour >= limit;
}

/** Fixed-window in-memory counter. `take()` returns false once the window is full. */
export class HourlyLimiter {
    private windows = new Map<string, { start: number; count: number }>();

    constructor(
        private readonly limit = RATE_LIMIT_PER_HOUR,
        private readonly maxKeys = 10_000,
    ) {}

    take(key: string, now: number = Date.now()): boolean {
        let w = this.windows.get(key);
        if (!w || now - w.start >= HOUR_MS) {
            if (!w && this.windows.size >= this.maxKeys) this.prune(now);
            w = { start: now, count: 0 };
            this.windows.set(key, w);
        }
        if (w.count >= this.limit) return false;
        w.count += 1;
        return true;
    }

    private prune(now: number) {
        for (const [k, w] of this.windows) if (now - w.start >= HOUR_MS) this.windows.delete(k);
        // Still full (an attack spraying fresh keys): start over rather than grow.
        if (this.windows.size >= this.maxKeys) this.windows.clear();
    }
}

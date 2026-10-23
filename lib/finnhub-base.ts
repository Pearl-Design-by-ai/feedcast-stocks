/**
 * Finnhub REST base. Overridable so a local `opennextjs-cloudflare preview`
 * can be pointed at a latency-mocked upstream for performance measurement;
 * production leaves FINNHUB_BASE_URL unset.
 */
export const FINNHUB_BASE_URL = (process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1').replace(/\/$/, '');

// Live Finnhub requests made by this isolate. The cron warm-up reads the delta
// to pace itself under the free-tier rate limit (60/min, shared with users).
let liveCalls = 0;
export function noteFinnhubCall(): void {
    liveCalls++;
}
export function finnhubCallCount(): number {
    return liveCalls;
}

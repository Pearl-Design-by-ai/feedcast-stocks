/**
 * Feedcast Markets cron Worker — fires a Cloudflare Cron Trigger and
 * forwards to the main app Worker's price-alert endpoint.
 *
 * Why a separate Worker instead of extending the main OpenNext worker:
 * the OpenNext-generated `.open-next/worker.js` is regenerated on every
 * build, so a `scheduled()` handler injected there would be lost. Keep
 * cron logic isolated; the main app Worker stays untouched.
 *
 * Every 5 minutes it POSTs to /api/cron/check-alerts with the
 * CRON_SECRET as Bearer auth.
 */

interface Env {
  /** Main app worker URL, e.g. https://markets.feedcast.news */
  APP_URL: string;
  /** Shared secret enforced by the /api/cron/check-alerts route. */
  CRON_SECRET: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const url = `${env.APP_URL}/api/cron/check-alerts`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
      const ms = Date.now() - start;
      console.log(`[cron] ${event.cron} → /api/cron/check-alerts ${res.status} ${ms}ms`);
    } catch (err) {
      console.error(`[cron] ${event.cron} → /api/cron/check-alerts FAILED:`, err);
    }
  },

  // Required so the deploy doesn't fail with "Worker has no handler" —
  // this Worker is never exposed via HTTPS, so it just 404s.
  async fetch(): Promise<Response> {
    return new Response('cron worker — no http surface', { status: 404 });
  },
};

/**
 * Feedcast Stocks cron Worker — fires a Cloudflare Cron Trigger and
 * forwards to the main app Worker's cron endpoints.
 *
 * Why a separate Worker instead of extending the main OpenNext worker:
 * the OpenNext-generated `.open-next/worker.js` is regenerated on every
 * build, so a `scheduled()` handler injected there would be lost. Keep
 * cron logic isolated; the main app Worker stays untouched.
 *
 * Two schedules (see wrangler.jsonc), dispatched on `event.cron`:
 *   - every 5 minutes → POST /api/cron/check-alerts (price alerts)
 *   - every 10 minutes → POST /api/cron/warm-stocks (stock-page cache warm-up)
 * Both send the CRON_SECRET as Bearer auth.
 */

interface Env {
  /** Main app worker URL, e.g. https://stocks.feedcast.news */
  APP_URL: string;
  /** Shared secret enforced by the /api/cron/* routes. */
  CRON_SECRET: string;
}

const WARM_CRON = '*/10 * * * *';

async function post(env: Env, path: string, cron: string): Promise<void> {
  const start = Date.now();
  try {
    const res = await fetch(`${env.APP_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    console.log(`[cron] ${cron} → ${path} ${res.status} ${Date.now() - start}ms`);
  } catch (err) {
    console.error(`[cron] ${cron} → ${path} FAILED:`, err);
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    if (event.cron === WARM_CRON) {
      await post(env, '/api/cron/warm-stocks', event.cron);
      return;
    }
    await post(env, '/api/cron/check-alerts', event.cron);
  },

  // Required so the deploy doesn't fail with "Worker has no handler" —
  // this Worker is never exposed via HTTPS, so it just 404s.
  async fetch(): Promise<Response> {
    return new Response('cron worker — no http surface', { status: 404 });
  },
};

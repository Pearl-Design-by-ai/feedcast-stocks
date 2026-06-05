import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// No ISR/page cache override: this is a real-time market dashboard, so we
// render fresh on every request rather than serving stale R2-cached pages.
// Finnhub responses are still de-duped within a request via per-fetch
// `next.revalidate` windows (see lib/actions/finnhub.actions.ts).
//
// Dropping the R2 incremental cache also removes the deploy-time
// `populate remote R2 incremental cache` step, which was failing with a
// 403 under the CI Global API Key auth and blocking every deployment.
export default defineCloudflareConfig({});

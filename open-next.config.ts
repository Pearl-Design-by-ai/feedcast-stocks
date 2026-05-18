import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';

export default defineCloudflareConfig({
  // Persist ISR-rendered pages + fetch cache to R2 so subsequent edge
  // requests get sub-100ms TTFB instead of re-rendering on every hit.
  // Bound via NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc.
  incrementalCache: r2IncrementalCache,
});

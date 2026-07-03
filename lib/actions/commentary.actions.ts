'use server';

/**
 * Proxy shim → PRIVATE markets-engine. Per-page AI commentary (prompt + live
 * context assembly + caching) runs in the closed engine; this only forwards the
 * topic. See `lib/engine-client.ts`.
 */

import { enginePost } from '@/lib/engine-client';

export type CommentaryResult = { ok: true; comment: string } | { ok: false; error: string };

// The commentary block is public (no login), so the only cost control is the
// engine's per-topic cache. Because `topic` is part of the cache key, it must be
// constrained to this fixed allowlist — otherwise a caller could vary `topic`
// freely to force unlimited cache-miss LLM generations. Keep in sync with
// AiCommentary's TOPIC_PATHS and the engine's TOPIC_LABELS keys.
const ALLOWED_TOPICS = new Set([
  'market-regime',
  'market-indicators',
  'sectors',
  'world-indices',
  'currency',
  'commodities',
  'fixed-income',
  'crypto',
  'economic-calendar',
  'calendar',
  'screener',
  'compare',
  'etfs',
  'stocks',
]);

export async function getCommentary(topic: string): Promise<CommentaryResult> {
  if (typeof topic !== 'string' || !ALLOWED_TOPICS.has(topic)) {
    return { ok: false, error: 'Unknown commentary topic.' };
  }
  return enginePost<CommentaryResult>(
    '/v1/commentary',
    { topic },
    { ok: false, error: 'AI commentary is not configured yet.' },
    25_000
  );
}

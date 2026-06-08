'use server';

/**
 * Proxy shim → PRIVATE markets-engine. Per-page AI commentary (prompt + live
 * context assembly + caching) runs in the closed engine; this only forwards the
 * topic. See `lib/engine-client.ts`.
 */

import { enginePost } from '@/lib/engine-client';

export type CommentaryResult = { ok: true; comment: string } | { ok: false; error: string };

export async function getCommentary(topic: string): Promise<CommentaryResult> {
  return enginePost<CommentaryResult>(
    '/v1/commentary',
    { topic },
    { ok: false, error: 'AI commentary is not configured yet.' },
    25_000
  );
}

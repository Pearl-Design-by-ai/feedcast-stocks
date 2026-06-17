'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The Learn article library is served by
 * the engine; the public app fetches it (at build time for the SSG article
 * pages, and at request time for the dynamic hub). Returns [] if the engine is
 * unconfigured/unreachable. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';
import type { Article } from '@/lib/learn';

export async function getLearnArticles(): Promise<Article[]> {
    return engineGet<Article[]>('/v1/learn/articles', {}, []);
}

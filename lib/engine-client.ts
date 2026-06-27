'use server';

/**
 * Thin client for the PRIVATE markets-engine (a separate program reached over a
 * generic HTTP API). Only the public app's server calls this — the bearer token
 * is a server-side secret and never reaches the browser.
 *
 * Every call degrades gracefully: if the engine is unconfigured, unreachable, or
 * errors, we return `fallback` so the AI/analysis features simply hide rather
 * than break the page.
 *
 * Responses for shareable endpoints are cached in Cloudflare KV (cross-isolate,
 * see lib/market-cache.ts) — without it, every page view re-generates the same
 * company brief / commentary and burns engine capacity. /v1/ask is deliberately
 * uncached (conversational), and fallback or `{ ok: false }` results are never
 * cached so errors don't stick for the TTL.
 */

import { getMarketKV, fnv1a } from '@/lib/market-cache';

const BASE = (process.env.MARKETS_ENGINE_URL ?? '').replace(/\/$/, '');
const TOKEN = (process.env.MARKETS_ENGINE_TOKEN ?? '').trim();

// Path-prefix → cache TTL (seconds). Anything not listed is uncached.
const CACHE_TTLS: Array<[prefix: string, seconds: number]> = [
  ['/v1/indicator/explain', 86_400], // educational, static
  ['/v1/company/brief', 3_600],
  ['/v1/company/bullbear', 1_800],
  ['/v1/company/consensus', 21_600], // heavy multi-section analysis; changes slowly
  ['/v1/portfolio/lens', 1_800], // portfolio-level value-cycle read; basket-keyed
  ['/v1/portfolio/suggest', 10_800], // AI ETF starter portfolios; static-ish per risk/horizon
  ['/v1/market/brief', 300],
  ['/v1/market/regime', 300],
  ['/v1/commentary', 300],
  ['/v1/watchlist/digest', 300],
  ['/v1/news/impact', 300],
  ['/v1/divergence', 300],
  // EOD analysis reports — change at most once per trading day; cache 30min.
  ['/v1/crash', 1_800],
  ['/v1/signals', 1_800],
  ['/v1/leverage', 1_800],
  ['/v1/bubble', 1_800],
  // Curated indicator catalog — static editorial.
  ['/v1/indicators/catalog', 86_400],
  // Valuation screen — rebuilt by the engine cron; a short cache is plenty.
  ['/v1/valuation/screen', 300],
];

function cacheTtlFor(path: string): number {
  const entry = CACHE_TTLS.find(([prefix]) => path.startsWith(prefix));
  return entry ? entry[1] : 0;
}

/** True for in-band error payloads like `{ ok: false, error }` — never cached. */
function isErrorShaped(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    (value as { ok?: unknown }).ok === false
  );
}

async function call<T>(
  path: string,
  init: RequestInit & { fallback: T; timeoutMs?: number }
): Promise<T> {
  const { fallback, timeoutMs = 28_000, ...rest } = init;
  if (!BASE || !TOKEN) return fallback;

  const ttl = cacheTtlFor(path);
  const kv = ttl > 0 ? await getMarketKV() : null;
  const cacheKey = `eng:${path}:${typeof rest.body === 'string' ? fnv1a(rest.body) : ''}`;
  if (kv) {
    try {
      const hit = await kv.get(cacheKey, 'json');
      if (hit !== null) return hit as T;
    } catch {
      // KV read failure — fall through to the live call.
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...rest.headers,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as T;

    if (kv && data !== null && data !== undefined && !isErrorShaped(data)) {
      try {
        await kv.put(cacheKey, JSON.stringify(data), {
          // KV's minimum TTL is 60s.
          expirationTtl: Math.max(60, ttl),
        });
      } catch {
        // Cache write failure is non-fatal.
      }
    }
    return data;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

/** GET with query params. */
export async function engineGet<T>(path: string, params: Record<string, string>, fallback: T): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  return call<T>(`${path}${qs ? `?${qs}` : ''}`, { method: 'GET', fallback });
}

/** POST with a JSON body. */
export async function enginePost<T>(path: string, body: unknown, fallback: T, timeoutMs?: number): Promise<T> {
  return call<T>(path, { method: 'POST', body: JSON.stringify(body), fallback, timeoutMs });
}

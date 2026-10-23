/**
 * Stale-while-revalidate cache for upstream market data (Finnhub, the private
 * engine, Adanos, Yahoo closes).
 *
 * Two layers: a small per-isolate memory map (free hits within a warm isolate)
 * over the cross-isolate MARKET_CACHE KV binding (see lib/market-cache.ts).
 * Each entry stores its fetch time, so one read can tell fresh from stale:
 *
 *   age < fresh            → return it
 *   age < fresh + stale    → return it now, refresh in the background
 *   missing                → fetch, but wait at most `timeoutMs`; if the
 *                            upstream is slower the caller gets `null` (its
 *                            graceful fallback) and the fetch keeps running
 *                            under `waitUntil` so the NEXT view is warm.
 *
 * So a slow upstream costs at most one bounded wait, never a blocked page, and
 * a cold upstream doesn't hit the user twice. Concurrent misses for the same
 * key share one in-flight fetch. Values the `shouldCache` predicate rejects
 * (default: null/undefined, the "fetch failed" convention) are returned but
 * never stored, so an upstream blip doesn't stick for the TTL.
 */

import { getMarketKV } from '@/lib/market-cache';

export interface SwrOptions<T> {
    /** Seconds an entry is served without revalidation. */
    fresh: number;
    /** Extra seconds a stale entry may be served while it revalidates. Default: max(4×fresh, 1h), capped at 7d. */
    stale?: number;
    /** Max ms a caller waits on a cache miss before getting `null`. Default: wait for the loader. */
    timeoutMs?: number;
    /** Whether a loaded value may be stored. Default: not null/undefined. */
    shouldCache?: (value: T) => boolean;
}

type Envelope<T> = { v: T; t: number };

const KV_PREFIX = 'swr:';
const MEM_MAX = 500;
const mem = new Map<string, Envelope<unknown> & { exp: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function defaultStaleSeconds(fresh: number): number {
    return Math.min(Math.max(fresh * 4, 3600), 7 * 86400);
}

/** Keep a promise alive past the response on Workers; best-effort elsewhere. */
export async function runInBackground(p: Promise<unknown>): Promise<void> {
    p.catch(() => {});
    try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        getCloudflareContext().ctx?.waitUntil(p);
    } catch {
        // No Workers context (next dev, tests) — the promise just runs to completion.
    }
}

function memGet<T>(key: string): Envelope<T> | null {
    const hit = mem.get(key);
    if (!hit) return null;
    if (hit.exp <= Date.now()) {
        mem.delete(key);
        return null;
    }
    return hit as Envelope<T>;
}

function memSet<T>(key: string, env: Envelope<T>, lifetimeMs: number) {
    if (mem.size >= MEM_MAX) {
        const now = Date.now();
        for (const [k, v] of mem) if (v.exp <= now) mem.delete(k);
        // Still full: drop the oldest insertion.
        if (mem.size >= MEM_MAX) mem.delete(mem.keys().next().value as string);
    }
    mem.set(key, { ...env, exp: env.t + lifetimeMs });
}

async function readEntry<T>(key: string, lifetimeMs: number): Promise<Envelope<T> | null> {
    const local = memGet<T>(key);
    if (local) return local;
    const kv = await getMarketKV();
    if (!kv) return null;
    try {
        const hit = (await kv.get(KV_PREFIX + key, 'json')) as Envelope<T> | null;
        if (hit && typeof hit.t === 'number' && 'v' in hit) {
            memSet(key, hit, lifetimeMs);
            return hit;
        }
    } catch {
        // KV read failure — treat as a miss.
    }
    return null;
}

function refresh<T>(
    key: string,
    lifetimeMs: number,
    shouldCache: (value: T) => boolean,
    loader: () => Promise<T>
): Promise<T | null> {
    const existing = inflight.get(key) as Promise<T | null> | undefined;
    if (existing) return existing;

    const p = (async () => {
        try {
            const value = await loader();
            if (shouldCache(value)) {
                const env: Envelope<T> = { v: value, t: Date.now() };
                memSet(key, env, lifetimeMs);
                const kv = await getMarketKV();
                if (kv) {
                    try {
                        // KV's minimum TTL is 60s.
                        await kv.put(KV_PREFIX + key, JSON.stringify(env), {
                            expirationTtl: Math.max(60, Math.ceil(lifetimeMs / 1000)),
                        });
                    } catch {
                        // Cache write failure is non-fatal.
                    }
                }
            }
            return value ?? null;
        } catch (err) {
            console.error(`swr refresh failed for ${key}`, err);
            return null;
        } finally {
            inflight.delete(key);
        }
    })();
    inflight.set(key, p);
    return p;
}

export async function swrCached<T>(
    key: string,
    opts: SwrOptions<T>,
    loader: () => Promise<T>
): Promise<T | null> {
    const freshMs = opts.fresh * 1000;
    const lifetimeMs = freshMs + (opts.stale ?? defaultStaleSeconds(opts.fresh)) * 1000;
    const shouldCache = opts.shouldCache ?? ((v: T) => v !== null && v !== undefined);

    const entry = await readEntry<T>(key, lifetimeMs);
    if (entry) {
        const age = Date.now() - entry.t;
        if (age < freshMs) return entry.v;
        if (age < lifetimeMs) {
            if (!inflight.has(key)) void runInBackground(refresh(key, lifetimeMs, shouldCache, loader));
            return entry.v;
        }
    }

    const pending = refresh(key, lifetimeMs, shouldCache, loader);
    if (!opts.timeoutMs) return pending;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), opts.timeoutMs);
    });
    const winner = await Promise.race([pending, timedOut]);
    clearTimeout(timer);
    if (winner === 'timeout') {
        // Let the fetch finish and fill the cache for the next view.
        void runInBackground(pending);
        return null;
    }
    return winner;
}

/** Test hook: clear the per-isolate layer. */
export function __resetSwrMemory() {
    mem.clear();
    inflight.clear();
}

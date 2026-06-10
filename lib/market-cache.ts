/**
 * Cross-isolate cache helpers backed by the MARKET_CACHE Cloudflare KV
 * binding (see wrangler.jsonc). Module-level Maps and fetch revalidate hints
 * are per-isolate on Workers — the OpenNext incremental cache is intentionally
 * disabled — so anything that should be shared across requests goes through
 * here. The binding is absent in `next dev` / builds; callers fall back to a
 * live fetch unchanged.
 */

export type KVLite = {
    get(key: string, type: 'json'): Promise<unknown>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

export async function getMarketKV(): Promise<KVLite | null> {
    try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        const env = getCloudflareContext().env as { MARKET_CACHE?: KVLite };
        return env.MARKET_CACHE ?? null;
    } catch {
        return null;
    }
}

/**
 * Read-through KV cache for a JSON-producing fetch. `null`/`undefined`
 * results (the "fetch failed" convention across our actions) are never
 * cached, so an upstream blip doesn't stick for the TTL.
 */
export async function kvCachedJSON<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
): Promise<T> {
    const kv = await getMarketKV();
    if (kv) {
        try {
            const hit = await kv.get(key, 'json');
            if (hit !== null) return hit as T;
        } catch {
            // KV read failure — fall through to the live call.
        }
    }

    const value = await fn();

    if (kv && value !== null && value !== undefined) {
        try {
            // KV's minimum TTL is 60s.
            await kv.put(key, JSON.stringify(value), {
                expirationTtl: Math.max(60, ttlSeconds),
            });
        } catch {
            // Cache write failure is non-fatal.
        }
    }
    return value;
}

/** Tiny stable hash (FNV-1a) for turning request bodies into KV key parts. */
export function fnv1a(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
}

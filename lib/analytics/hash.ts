/**
 * Daily-rotating visitor hash. Pure Web Crypto (Workers + Node 20), no Next
 * imports, so it's unit-tested.
 *
 *   daily_salt   = HMAC-SHA256(secret, "markets-analytics:" + UTC date)
 *   visitor_hash = SHA-256(daily_salt + ip + user_agent), first 16 hex chars
 *
 * The salt is never stored, so once the UTC day ends the day's hashes can't be
 * recomputed from an IP — and the same visitor gets an unrelated hash tomorrow.
 * The IP and full UA are only ever inputs here; nothing persists them.
 */

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** UTC calendar date, YYYY-MM-DD. */
export function utcDate(now: Date): string {
    return now.toISOString().slice(0, 10);
}

/**
 * The salt secret. Prefers ANALYTICS_SALT_SECRET; falls back to the
 * SUPABASE_SERVICE_ROLE_KEY (already a required server-only secret — the
 * collector can't insert without it anyway). Null when neither is set.
 */
export function resolveSaltSecret(env: {
    ANALYTICS_SALT_SECRET?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
}): string | null {
    return env.ANALYTICS_SALT_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export async function dailySalt(secret: string, now: Date): Promise<string> {
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
        'sign',
    ]);
    return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(`markets-analytics:${utcDate(now)}`)));
}

export async function visitorHash(secret: string, ip: string, userAgent: string, now: Date): Promise<string> {
    const salt = await dailySalt(secret, now);
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(salt + ip + userAgent));
    return toHex(digest).slice(0, 16);
}

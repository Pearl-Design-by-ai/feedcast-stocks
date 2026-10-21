import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCookieOptions, SESSION_STORAGE_KEY } from '@/lib/supabase/cookie-storage';
import {
    isBotUserAgent,
    isCloudflareBot,
    isOptOut,
    normalizePath,
    parseBeaconPayload,
    sanitizeCountry,
    sanitizeReferrerHost,
} from '@/lib/analytics/shared';
import { resolveSaltSecret, visitorHash } from '@/lib/analytics/hash';
import { HourlyLimiter, overHourlyLimit } from '@/lib/analytics/rate-limit';
import { classifyViewer } from '@/lib/analytics/owner';

/**
 * First-party, cookieless page-view collector. The beacon in the root layout
 * POSTs one small JSON body per page view. We always answer 204 immediately and
 * do the work (auth lookup, rate-limit count, insert) in waitUntil.
 *
 * Stored per view: normalized path, referrer host, country, device class, a
 * daily-rotating visitor hash (skipped under DNT / Sec-GPC), user_id for
 * signed-in visitors, and is_owner / is_bot flags. Never the IP or full UA.
 */

export const dynamic = 'force-dynamic';

const NO_CONTENT = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

// Per-isolate burst guard; the DB count below is the authoritative limit.
const limiter = new HourlyLimiter();

type CfContext = { cf?: unknown; ctx?: { waitUntil(p: Promise<unknown>): void } };

async function cloudflareContext(): Promise<CfContext> {
    try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        return getCloudflareContext() as CfContext;
    } catch {
        return {};
    }
}

/** The signed-in Supabase user from the SSO cookie, read straight off the request. */
async function sessionUser(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const cookies = request.cookies.getAll();
    if (!cookies.some((c) => c.name.startsWith(SESSION_STORAGE_KEY))) return null;
    const supabase = createServerClient(url, anonKey, {
        cookieOptions: getCookieOptions(request.headers.get('host')),
        auth: { storageKey: SESSION_STORAGE_KEY },
        // Read-only: the collector never sets cookies.
        cookies: { getAll: () => cookies, setAll: () => {} },
    });
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
}

export async function POST(request: NextRequest) {
    // Cross-site posts are never ours.
    if (request.headers.get('sec-fetch-site') === 'cross-site') return NO_CONTENT();

    const payload = parseBeaconPayload(await request.text().catch(() => ''));
    const path = payload ? normalizePath(payload.path) : null;
    // No JS-sent payload → not a real page view; drop.
    if (!payload || !path) return NO_CONTENT();

    const { cf, ctx } = await cloudflareContext();
    const ua = request.headers.get('user-agent') ?? '';
    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
    const optOut = isOptOut(request.headers);

    const work = (async () => {
        const secret = resolveSaltSecret({
            ANALYTICS_SALT_SECRET: process.env.ANALYTICS_SALT_SECRET,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        });
        const now = new Date();
        const hash = !optOut && secret && ip ? await visitorHash(secret, ip, ua, now) : null;

        if (hash && !limiter.take(hash)) return;

        const admin = getSupabaseAdmin();
        if (hash) {
            const { count } = await admin
                .from('markets_page_views')
                .select('id', { count: 'exact', head: true })
                .eq('visitor_hash', hash)
                .gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
            if (overHourlyLimit(count ?? 0)) return;
        }

        // The beacon's signedIn flag is only a hint (the SSO cookie may be
        // HttpOnly); the session cookie itself is verified here. No cookie →
        // no auth round-trip.
        const user = await sessionUser(request).catch(() => null);
        const viewer = classifyViewer(user, optOut);

        const { error } = await admin.from('markets_page_views').insert({
            path,
            referrer_host: sanitizeReferrerHost(payload.ref, request.headers.get('host')),
            country: sanitizeCountry((cf as { country?: unknown } | undefined)?.country ?? request.headers.get('cf-ipcountry')),
            device: payload.device,
            visitor_hash: hash,
            user_id: viewer.userId,
            is_owner: viewer.isOwner,
            is_bot: isCloudflareBot(cf) || isBotUserAgent(ua) || payload.webdriver,
        });
        if (error) console.error('analytics: insert failed', error.message);
    })().catch((err) => console.error('analytics: beacon failed', err));

    if (ctx?.waitUntil) ctx.waitUntil(work);
    else void work;

    return NO_CONTENT();
}

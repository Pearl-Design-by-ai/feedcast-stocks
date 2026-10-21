/**
 * First-party page-view analytics — pure helpers shared by the beacon
 * (components/PageViewBeacon.tsx), the collector (app/api/a/route.ts) and the
 * owner stats page. No Next/Supabase imports so everything here is unit-tested.
 *
 * Privacy model: no cookies or client IDs are set, the IP and full UA are never
 * stored, and the per-visitor hash rotates daily (see ./hash.ts), so a visitor
 * can't be followed across days or sites.
 */

export const BEACON_PATH = '/api/a';

/** Query keys that survive path normalization — everything else is dropped. */
export const QUERY_WHITELIST = ['symbol', 'category'] as const;

export const DEVICES = ['mobile', 'tablet', 'desktop'] as const;
export type Device = (typeof DEVICES)[number];

const MAX_PATH = 200;
const SAFE_QUERY_VALUE = /^[A-Za-z0-9.\-^=:_]{1,32}$/;

/** Hosts that count as "this site" — their referrals are internal, not traffic sources. */
const OWN_HOSTS = new Set(['markets.feedcast.news', 'stocks.feedcast.news', 'localhost', '127.0.0.1']);

/** Viewport width → coarse device class (Tailwind's md / lg breakpoints). */
export function classifyDevice(width: number): Device {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

export function isDevice(v: unknown): v is Device {
    return typeof v === 'string' && (DEVICES as readonly string[]).includes(v);
}

/**
 * Normalize a client-reported location to a storable path: same-origin paths
 * only, no fragment, no trailing slash, and every query key stripped except the
 * whitelisted ones (with sane values). Returns null for anything unusable.
 */
export function normalizePath(input: unknown): string | null {
    if (typeof input !== 'string' || !input.startsWith('/') || input.startsWith('//')) return null;
    let url: URL;
    try {
        url = new URL(input, 'https://local.invalid');
    } catch {
        return null;
    }
    if (url.origin !== 'https://local.invalid') return null;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/api' || path.startsWith('/api/') || path.startsWith('/_next/')) return null;

    const kept = new URLSearchParams();
    for (const key of QUERY_WHITELIST) {
        const value = url.searchParams.get(key);
        if (value && SAFE_QUERY_VALUE.test(value)) kept.set(key, value);
    }
    const qs = kept.toString();
    return (qs ? `${path}?${qs}` : path).slice(0, MAX_PATH);
}

/** The ticker a normalized path is about (`/stocks/AAPL` or `?symbol=AAPL`), uppercased. */
export function extractTicker(path: string | null): string | null {
    if (!path) return null;
    const [pathname, qs = ''] = path.split('?');
    const fromQuery = new URLSearchParams(qs).get('symbol');
    let raw: string | null = fromQuery;
    if (!raw) {
        const m = /^\/stocks\/([^/]+)$/.exec(pathname);
        if (m && m[1] !== 'lists') raw = m[1];
    }
    if (!raw) return null;
    try {
        raw = decodeURIComponent(raw);
    } catch {
        return null;
    }
    const ticker = raw.trim().toUpperCase();
    return SAFE_QUERY_VALUE.test(ticker) ? ticker : null;
}

/**
 * Reduce a referrer (full URL or bare host) to its hostname, minus a leading
 * `www.`. Self-referrals (this site, or `ownHost`) and junk return null.
 */
export function sanitizeReferrerHost(input: unknown, ownHost?: string | null): string | null {
    if (typeof input !== 'string' || !input.trim()) return null;
    const raw = input.trim();
    let host: string;
    try {
        host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase();
    } catch {
        return null;
    }
    if (!/^[a-z0-9.-]{1,253}$/.test(host) || !host.includes('.')) return null;
    const own = ownHost?.split(':')[0].toLowerCase();
    if (OWN_HOSTS.has(host) || host === own) return null;
    return host.replace(/^www\./, '');
}

/**
 * Crawlers, monitors, scripted clients, headless browsers and the main AI
 * crawlers. Matching rows are stored with is_bot=true (not dropped) so the
 * stats page can show the bot share.
 */
const BOT_UA =
    /bot|crawl|spider|slurp|headless|lighthouse|python|curl|wget|httpclient|http-client|preview|monitor|uptime|pingdom|phantomjs|puppeteer|playwright|selenium|axios|node-fetch|go-http|okhttp|java\/|libwww|scrapy|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|ccbot|bytespider|amazonbot|applebot|google-extended|meta-externalagent|facebookexternalhit|cohere|diffbot|youbot|timpibot|imagesift/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
    return !ua || ua.length < 10 || BOT_UA.test(ua);
}

/**
 * Cloudflare Bot Management verdict, when the plan exposes it (it doesn't on
 * Free — then this is always false and the UA regex carries the load).
 */
export function isCloudflareBot(cf: unknown): boolean {
    const bm = (cf as { botManagement?: { score?: unknown; verifiedBot?: unknown } } | null | undefined)?.botManagement;
    if (!bm) return false;
    if (bm.verifiedBot === true) return true;
    return typeof bm.score === 'number' && bm.score > 0 && bm.score < 30;
}

/** Do Not Track / Global Privacy Control: count the view, skip the visitor hash. */
export function isOptOut(headers: { get(name: string): string | null }): boolean {
    return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}

/** Two-letter country from `request.cf.country` (or the cf-ipcountry header). */
export function sanitizeCountry(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const c = input.trim().toUpperCase();
    return /^[A-Z][A-Z0-9]$/.test(c) && c !== 'XX' ? c : null;
}

/** The JSON body the beacon sends. Anything that doesn't parse to this is dropped. */
export interface BeaconPayload {
    path: string;
    ref: string;
    device: Device;
    signedIn: boolean;
    webdriver: boolean;
}

export function parseBeaconPayload(text: string): BeaconPayload | null {
    if (!text || text.length > 2048) return null;
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return null;
    }
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d.path !== 'string' || !isDevice(d.device) || typeof d.signedIn !== 'boolean') return null;
    return {
        path: d.path,
        ref: typeof d.ref === 'string' ? d.ref : '',
        device: d.device,
        signedIn: d.signedIn,
        webdriver: d.webdriver === true,
    };
}

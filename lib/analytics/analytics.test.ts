import { describe, it, expect } from 'vitest';
import {
    classifyDevice,
    extractTicker,
    isBotUserAgent,
    isCloudflareBot,
    isOptOut,
    normalizePath,
    parseBeaconPayload,
    sanitizeCountry,
    sanitizeReferrerHost,
} from './shared';
import { dailySalt, resolveSaltSecret, utcDate, visitorHash } from './hash';
import { HourlyLimiter, overHourlyLimit, RATE_LIMIT_PER_HOUR } from './rate-limit';
import { canViewStats, classifyViewer } from './owner';
import { isRetentionDue, retentionCutoff } from './retention';
import { aggregateStats, dayKeys, type PageViewRow } from './stats';

const SECRET = 'test-secret';
const IP = '203.0.113.42';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15';

describe('visitor hash', () => {
    const day1 = new Date('2026-10-21T08:00:00Z');
    const day1Late = new Date('2026-10-21T23:59:59Z');
    const day2 = new Date('2026-10-22T00:00:01Z');

    it('is 16 lowercase hex chars', async () => {
        expect(await visitorHash(SECRET, IP, UA, day1)).toMatch(/^[0-9a-f]{16}$/);
    });

    it('is stable within a UTC day', async () => {
        expect(await visitorHash(SECRET, IP, UA, day1)).toBe(await visitorHash(SECRET, IP, UA, day1Late));
    });

    it('rotates at the UTC day boundary', async () => {
        expect(await visitorHash(SECRET, IP, UA, day1)).not.toBe(await visitorHash(SECRET, IP, UA, day2));
        expect(await dailySalt(SECRET, day1)).not.toBe(await dailySalt(SECRET, day2));
        expect(utcDate(day2)).toBe('2026-10-22');
    });

    it('depends on the secret, the IP and the UA', async () => {
        const base = await visitorHash(SECRET, IP, UA, day1);
        expect(await visitorHash('other', IP, UA, day1)).not.toBe(base);
        expect(await visitorHash(SECRET, '203.0.113.43', UA, day1)).not.toBe(base);
        expect(await visitorHash(SECRET, IP, `${UA} x`, day1)).not.toBe(base);
    });

    it('never contains the IP (or any of its octets) or the UA', async () => {
        for (const ip of [IP, '10.0.0.1', '2001:db8::1']) {
            const h = await visitorHash(SECRET, ip, UA, day1);
            expect(h).not.toContain(ip);
            expect(h).not.toContain(ip.replace(/[.:]/g, ''));
            expect(h).not.toContain('Mozilla');
        }
    });

    it('prefers ANALYTICS_SALT_SECRET and falls back to the service-role key', () => {
        expect(resolveSaltSecret({ ANALYTICS_SALT_SECRET: 'a', SUPABASE_SERVICE_ROLE_KEY: 'b' })).toBe('a');
        expect(resolveSaltSecret({ SUPABASE_SERVICE_ROLE_KEY: 'b' })).toBe('b');
        expect(resolveSaltSecret({})).toBeNull();
    });
});

describe('bot classification', () => {
    it.each([
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
        'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
        'Mozilla/5.0 (compatible; PerplexityBot/1.0)',
        'CCBot/2.0 (https://commoncrawl.org/faq/)',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0) Chrome-Lighthouse',
        'python-requests/2.31.0',
        'curl/8.4.0',
        'Wget/1.21.4',
        'Apache-HttpClient/4.5.14 (Java/17)',
        'UptimeRobot/2.0',
        'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)',
        'facebookexternalhit/1.1',
        'Slackbot-LinkExpanding 1.0',
        '',
    ])('flags %s', (ua) => {
        expect(isBotUserAgent(ua)).toBe(true);
    });

    it.each([
        UA,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
    ])('passes %s', (ua) => {
        expect(isBotUserAgent(ua)).toBe(false);
    });

    it('reads Cloudflare bot management when present', () => {
        expect(isCloudflareBot(undefined)).toBe(false);
        expect(isCloudflareBot({ country: 'US' })).toBe(false);
        expect(isCloudflareBot({ botManagement: { score: 2 } })).toBe(true);
        expect(isCloudflareBot({ botManagement: { score: 90 } })).toBe(false);
        expect(isCloudflareBot({ botManagement: { score: 90, verifiedBot: true } })).toBe(true);
    });
});

describe('path normalization', () => {
    it('strips non-whitelisted query keys and fragments', () => {
        expect(normalizePath('/watchlist?list=abc123&utm_source=x')).toBe('/watchlist');
        expect(normalizePath('/compare?email=a@b.com#top')).toBe('/compare');
        expect(normalizePath('/stocks/AAPL/')).toBe('/stocks/AAPL');
    });

    it('keeps whitelisted keys with safe values', () => {
        expect(normalizePath('/compare?symbol=MSFT&fbclid=zzz')).toBe('/compare?symbol=MSFT');
        expect(normalizePath('/learn?category=basics')).toBe('/learn?category=basics');
        expect(normalizePath('/x?symbol=<script>')).toBe('/x');
    });

    it('rejects off-site, API and junk paths', () => {
        expect(normalizePath('https://evil.example/x')).toBeNull();
        expect(normalizePath('//evil.example/x')).toBeNull();
        expect(normalizePath('/api/a')).toBeNull();
        expect(normalizePath(42)).toBeNull();
        expect(normalizePath('/')).toBe('/');
    });

    it('caps the stored length', () => {
        expect(normalizePath(`/${'a'.repeat(500)}`)!.length).toBe(200);
    });

    it('extracts tickers from the path or the symbol query', () => {
        expect(extractTicker('/stocks/aapl')).toBe('AAPL');
        expect(extractTicker('/stocks/BRK.B')).toBe('BRK.B');
        expect(extractTicker('/stocks/%5EGSPC')).toBe('^GSPC');
        expect(extractTicker('/compare?symbol=nvda')).toBe('NVDA');
        expect(extractTicker('/stocks/lists')).toBeNull();
        expect(extractTicker('/stocks/lists/tech')).toBeNull();
        expect(extractTicker('/stocks')).toBeNull();
    });

    it('reduces referrers to an external host', () => {
        expect(sanitizeReferrerHost('https://www.google.com/search?q=secret')).toBe('google.com');
        expect(sanitizeReferrerHost('news.ycombinator.com')).toBe('news.ycombinator.com');
        expect(sanitizeReferrerHost('www.feedcast.news')).toBe('feedcast.news');
        expect(sanitizeReferrerHost('markets.feedcast.news')).toBeNull();
        expect(sanitizeReferrerHost('preview.example.dev', 'preview.example.dev:443')).toBeNull();
        expect(sanitizeReferrerHost('')).toBeNull();
        expect(sanitizeReferrerHost('not a host')).toBeNull();
    });

    it('classifies devices, countries, opt-out headers and payloads', () => {
        expect([375, 800, 1440].map(classifyDevice)).toEqual(['mobile', 'tablet', 'desktop']);
        expect(sanitizeCountry('tr')).toBe('TR');
        expect(sanitizeCountry('XX')).toBeNull();
        expect(isOptOut(new Headers({ dnt: '1' }))).toBe(true);
        expect(isOptOut(new Headers({ 'sec-gpc': '1' }))).toBe(true);
        expect(isOptOut(new Headers())).toBe(false);
        expect(parseBeaconPayload('')).toBeNull();
        expect(parseBeaconPayload('{"path":"/"}')).toBeNull();
        expect(parseBeaconPayload('{"path":"/","device":"desktop","signedIn":false}')).toEqual({
            path: '/',
            ref: '',
            device: 'desktop',
            signedIn: false,
            webdriver: false,
        });
    });
});

describe('owner detection', () => {
    const owner = { id: 'u-owner', email: 'AltugInci@gmail.com ' };
    const member = { id: 'u-1', email: 'someone@example.com' };

    it('flags the owner and keeps user_id for signed-in visitors', () => {
        expect(classifyViewer(owner, false)).toEqual({ userId: 'u-owner', isOwner: true });
        expect(classifyViewer(member, false)).toEqual({ userId: 'u-1', isOwner: false });
        expect(classifyViewer(null, false)).toEqual({ userId: null, isOwner: false });
    });

    it('drops user_id under DNT / GPC but still recognises the owner', () => {
        expect(classifyViewer(owner, true)).toEqual({ userId: null, isOwner: true });
        expect(classifyViewer(member, true)).toEqual({ userId: null, isOwner: false });
    });

    it('gates /my-stats to the owner', () => {
        expect(canViewStats(owner)).toBe(true);
        expect(canViewStats(member)).toBe(false);
        expect(canViewStats(null)).toBe(false);
    });
});

describe('rate limit', () => {
    it('caps at 120 per hour', () => {
        expect(RATE_LIMIT_PER_HOUR).toBe(120);
        expect(overHourlyLimit(119)).toBe(false);
        expect(overHourlyLimit(120)).toBe(true);
    });

    it('drops the excess in-window and resets after an hour', () => {
        const l = new HourlyLimiter(3);
        const t = 1_000_000;
        expect([1, 2, 3, 4].map((i) => l.take('h', t + i))).toEqual([true, true, true, false]);
        expect(l.take('other', t)).toBe(true);
        expect(l.take('h', t + 60 * 60 * 1000 + 1)).toBe(true);
    });

    it('stays bounded under key spraying', () => {
        const l = new HourlyLimiter(1, 5);
        for (let i = 0; i < 50; i++) expect(l.take(`k${i}`, 0)).toBe(true);
    });
});

describe('retention', () => {
    it('runs once a day after 03:00 UTC and cuts at 400 days', () => {
        expect(isRetentionDue(new Date('2026-10-21T03:02:00Z'))).toBe(true);
        expect(isRetentionDue(new Date('2026-10-21T03:05:00Z'))).toBe(false);
        expect(isRetentionDue(new Date('2026-10-21T15:02:00Z'))).toBe(false);
        expect(retentionCutoff(new Date('2026-10-21T03:00:00Z'))).toBe('2025-09-16T03:00:00.000Z');
    });
});

describe('stats aggregation', () => {
    const now = new Date('2026-10-21T12:00:00Z');
    const row = (over: Partial<PageViewRow>): PageViewRow => ({
        created_at: '2026-10-21T10:00:00Z',
        path: '/',
        referrer_host: null,
        country: 'TR',
        device: 'desktop',
        visitor_hash: 'h-a',
        user_id: null,
        is_owner: false,
        is_bot: false,
        ...over,
    });

    const rows: PageViewRow[] = [
        // Today: visitor A twice, visitor B once (signed in, from google), an opt-out view.
        row({ path: '/stocks/AAPL', referrer_host: 'google.com' }),
        row({ path: '/stocks/AAPL' }),
        row({ visitor_hash: 'h-b', user_id: 'u-1', path: '/stocks/MSFT', device: 'mobile', country: 'US' }),
        row({ visitor_hash: null }),
        // Yesterday: B again (new hash, same user) and A' (new hash).
        row({ created_at: '2026-10-20T09:00:00Z', visitor_hash: 'h-b2', user_id: 'u-1' }),
        row({ created_at: '2026-10-20T09:30:00Z', visitor_hash: 'h-a2', path: '/compare?symbol=AAPL' }),
        // Owner and a bot today.
        row({ visitor_hash: 'h-owner', user_id: 'u-owner', is_owner: true }),
        row({ visitor_hash: 'h-bot', is_bot: true }),
        // Outside the 7-day window.
        row({ created_at: '2026-10-14T23:59:59Z', visitor_hash: 'h-old' }),
    ];

    it('builds a zero-filled UTC day axis', () => {
        expect(dayKeys(7, now)).toEqual([
            '2026-10-15',
            '2026-10-16',
            '2026-10-17',
            '2026-10-18',
            '2026-10-19',
            '2026-10-20',
            '2026-10-21',
        ]);
    });

    it('excludes owner and bots by default', () => {
        const s = aggregateStats(rows, { days: 7, now, includeOwner: false, includeBots: false });
        expect(s.pageViews).toBe(6);
        // Today {h-a, h-b} + yesterday {h-b2, h-a2}.
        expect(s.uniqueVisitors).toBe(4);
        expect(s.optOutViews).toBe(1);
        expect(s.returningVisitors).toBe(1); // u-1 on two days
        expect(s.signedInUserIds).toEqual(['u-1']);
        expect(s.daily.at(-1)).toEqual({ day: '2026-10-21', views: 4, uniques: 2 });
        expect(s.daily.at(-2)).toEqual({ day: '2026-10-20', views: 2, uniques: 2 });
        expect(s.daily.slice(0, 5).every((d) => d.views === 0)).toBe(true);
        expect(s.topPages[0]).toEqual({ key: '/', count: 2 });
        expect(s.topTickers).toEqual([
            { key: 'AAPL', count: 3 },
            { key: 'MSFT', count: 1 },
        ]);
        expect(s.topReferrers).toEqual([{ key: 'google.com', count: 1 }]);
        expect(s.countries).toEqual([
            { key: 'TR', count: 5 },
            { key: 'US', count: 1 },
        ]);
        expect(s.devices).toEqual([
            { key: 'desktop', count: 5 },
            { key: 'mobile', count: 1 },
        ]);
        // Bot share is over owner-filtered views, bots included: 1 / 7.
        expect(s.bots).toEqual({ count: 1, total: 7, share: 1 / 7 });
    });

    it('includes the owner and bots when toggled, never listing the owner as a signed-in user', () => {
        const s = aggregateStats(rows, { days: 7, now, includeOwner: true, includeBots: true });
        expect(s.pageViews).toBe(8);
        expect(s.uniqueVisitors).toBe(6);
        expect(s.signedInUserIds).toEqual(['u-1']);
        expect(s.bots).toEqual({ count: 1, total: 8, share: 1 / 8 });
    });

    it('widens to 30 days', () => {
        const s = aggregateStats(rows, { days: 30, now, includeOwner: false, includeBots: false });
        expect(s.pageViews).toBe(7);
        expect(s.daily).toHaveLength(30);
    });

    it('handles no data', () => {
        const s = aggregateStats([], { days: 7, now, includeOwner: false, includeBots: false });
        expect(s.pageViews).toBe(0);
        expect(s.bots.share).toBe(0);
        expect(s.daily).toHaveLength(7);
    });
});

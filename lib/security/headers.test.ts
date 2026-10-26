// Security headers (lib/security/headers.ts): base set on every response,
// enforced frame-ancestors + report-only CSP on pages, locked-down CSP on
// /api/*, the /api/csp-report intake, and the two non-Next layers
// (public/_headers, worker-wrapper.mjs). Run: npm test

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    API_CSP,
    BASE_SECURITY_HEADERS,
    CSP_REPORT_PATH,
    FRAME_ANCESTORS_SITE,
    IMAGE_CSP,
    OWN_CSP_API_ROUTES,
    PAGE_CSP_DIRECTIVES,
    PERMISSIONS_POLICY,
    pageCspReportOnly,
    securityHeaderRules,
    serializeCsp,
    staticAssetHeadersFile,
    withImageSecurityHeaders,
} from './headers';
import { blockedKey, CspReportAggregator, parseCspReports, PER_IP_PER_MINUTE } from './cspReport';

const ROOT = path.join(__dirname, '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Next's own compiler for `headers()` sources (the regex that lands in
// .next/routes-manifest.json), so the test matches exactly what Next does.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildCustomRoute } = require('next/dist/lib/build-custom-route') as {
    buildCustomRoute: (type: 'header', route: { source: string; headers: unknown[] }) => { regex: string };
};
function sourceMatches(source: string, pathname: string): boolean {
    return new RegExp(buildCustomRoute('header', { source, headers: [] }).regex).test(pathname);
}

/** Headers for a path, failing if two rules set the same key (last-wins would hide it). */
function headersFor(pathname: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const rule of securityHeaderRules()) {
        if (!sourceMatches(rule.source, pathname)) continue;
        for (const h of rule.headers) {
            expect(out[h.key], `${h.key} set twice for ${pathname}`).toBeUndefined();
            out[h.key] = h.value;
        }
    }
    return out;
}

const PAGES = ['/', '/stocks/AAPL', '/stocks/lists/most-active', '/watchlist', '/learn/what-is-a-pe-ratio', '/api-docs', '/screener', '/admin', '/_next/static/chunks/x.js', '/favicon.ico'];
const APIS = ['/api', '/api/a', '/api/health/markets', '/api/cron/check-alerts', '/api/csp-report'];

describe('security headers', () => {
    it('every path gets the base set', () => {
        for (const p of [...PAGES, ...APIS]) {
            const h = headersFor(p);
            expect(h['Strict-Transport-Security'], p).toBe('max-age=31536000; includeSubDomains');
            expect(h['X-Content-Type-Options'], p).toBe('nosniff');
            expect(h['X-Frame-Options'], p).toBe('DENY');
            expect(h['Referrer-Policy'], p).toBe('strict-origin-when-cross-origin');
            expect(h['Permissions-Policy'], p).toBe(PERMISSIONS_POLICY);
        }
    });

    it('pages: enforced frame-ancestors \'self\' + report-only policy + report endpoint', () => {
        for (const p of PAGES) {
            const h = headersFor(p);
            expect(h['Content-Security-Policy'], p).toBe(FRAME_ANCESTORS_SITE);
            expect(h['Content-Security-Policy-Report-Only'], p).toBe(pageCspReportOnly());
            expect(h['Reporting-Endpoints'], p).toBe(`csp="${CSP_REPORT_PATH}"`);
        }
        expect(pageCspReportOnly()).toContain(`report-uri ${CSP_REPORT_PATH}; report-to csp`);
    });

    it('/api/*: enforced default-src \'none\', no page policy', () => {
        for (const p of APIS) {
            const h = headersFor(p);
            expect(h['Content-Security-Policy'], p).toBe(API_CSP);
            expect(h['Content-Security-Policy-Report-Only'], p).toBeUndefined();
        }
    });

    it('API routes that set their own CSP are listed (config headers would override them)', () => {
        const found: string[] = [];
        const walk = (dir: string) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) walk(full);
                else if (/^route\.(ts|tsx|js)$/.test(e.name) && /content-security-policy/i.test(fs.readFileSync(full, 'utf8'))) {
                    found.push(path.relative(path.join(ROOT, 'app', 'api'), dir).split(path.sep).join('/'));
                }
            }
        };
        walk(path.join(ROOT, 'app', 'api'));
        for (const r of found) expect(OWN_CSP_API_ROUTES, `app/api/${r} sets its own CSP`).toContain(r);
    });

    it('a listed own-CSP route (and its sub-paths) is skipped by the API CSP rule only', () => {
        OWN_CSP_API_ROUTES.push('proxy-image');
        try {
            expect(headersFor('/api/proxy-image')['Content-Security-Policy']).toBeUndefined();
            expect(headersFor('/api/proxy-image/x')['Content-Security-Policy']).toBeUndefined();
            expect(headersFor('/api/proxy-image')['X-Content-Type-Options']).toBe('nosniff');
            expect(headersFor('/api/proxy-images')['Content-Security-Policy']).toBe(API_CSP);
            expect(headersFor('/api/a')['Content-Security-Policy']).toBe(API_CSP);
        } finally {
            OWN_CSP_API_ROUTES.pop();
        }
    });

    it('policy shape: no wildcard scripts, objects off, known embeds allowed', () => {
        const d = PAGE_CSP_DIRECTIVES;
        expect(d['object-src']).toEqual(["'none'"]);
        expect(d['base-uri']).toEqual(["'self'"]);
        expect(d['default-src']).toEqual(["'self'"]);
        for (const dir of ['script-src', 'connect-src', 'frame-src', 'style-src']) {
            expect(d[dir], dir).not.toContain('https:');
            expect(d[dir], dir).not.toContain('*');
        }
        expect(d['script-src']).not.toContain("'unsafe-eval'");
        expect(d['script-src']).toContain('https://s3.tradingview.com');
        expect(d['frame-src']).toContain('https://www.tradingview-widget.com');
        expect(d['connect-src']).toContain('wss://*.supabase.co');
        expect(d['connect-src']).toContain('https://auth.feedcast.news');
        expect('frame-ancestors' in d, 'frame-ancestors is ignored in report-only; it is sent enforced').toBe(false);
        expect(serializeCsp({ a: ['x', 'y'], b: [] })).toBe('a x y; b');
    });

    it('no headers in the base set that a browser would reject', () => {
        expect(PERMISSIONS_POLICY).not.toContain('interest-cohort');
        for (const { key, value } of BASE_SECURITY_HEADERS) {
            expect(value, key).not.toMatch(/[\r\n]/);
        }
    });

    it('next.config.ts installs the rules', () => {
        const cfg = read('next.config.ts');
        expect(cfg).toMatch(/import \{ securityHeaderRules \} from "\.\/lib\/security\/headers"/);
        expect(cfg).toMatch(/headers: async \(\) => securityHeaderRules\(\)/);
        expect(cfg).toMatch(/poweredByHeader: false/);
    });

    it('public/_headers carries the base set for Cloudflare static assets', () => {
        const file = read('public/_headers').split('\n').filter((l) => !l.startsWith('#')).join('\n').trim();
        expect(file).toBe(staticAssetHeadersFile());
    });

    it('worker-wrapper.mjs adds image headers on both /_next/image branches', () => {
        const w = read('worker-wrapper.mjs');
        expect(w).toContain("import { withImageSecurityHeaders } from './lib/security/headers.ts'");
        expect(w.match(/withImageSecurityHeaders\(/g)?.length).toBeGreaterThanOrEqual(4);
        expect(w).not.toMatch(/new Headers\(res\.headers\)/);
    });

    it('withImageSecurityHeaders adds, never overwrites', () => {
        const h = withImageSecurityHeaders(new Headers({ 'content-type': 'image/png', 'Content-Security-Policy': "default-src 'none'" }));
        expect(h.get('x-content-type-options')).toBe('nosniff');
        expect(h.get('content-security-policy')).toBe("default-src 'none'");
        expect(withImageSecurityHeaders(new Headers()).get('content-security-policy')).toBe(IMAGE_CSP);
    });
});

describe('csp-report intake', () => {
    it('parses both formats down to origin + path', () => {
        const legacy = parseCspReports(JSON.stringify({
            'csp-report': {
                'document-uri': 'https://markets.feedcast.news/stocks/AAPL?t=SECRET',
                'effective-directive': 'script-src-elem',
                'blocked-uri': 'https://evil.example.com/x.js?token=abc',
            },
        }));
        expect(legacy).toEqual([{ directive: 'script-src-elem', blocked: 'https://evil.example.com', page: '/stocks/AAPL' }]);
        const api = parseCspReports(JSON.stringify([
            { type: 'csp-violation', body: { documentURL: 'https://markets.feedcast.news/', effectiveDirective: 'connect-src', blockedURL: 'wss://x.example.com/s' } },
            { type: 'deprecation', body: {} },
        ]));
        expect(api).toEqual([{ directive: 'connect-src', blocked: 'wss://x.example.com', page: '/' }]);
        expect(parseCspReports('not json')).toEqual([]);
        expect(blockedKey('inline')).toBe('inline');
        expect(blockedKey('data:image/png;base64,xx')).toBe('data');
    });

    it('per-IP budget and aggregate logging', () => {
        const lines: string[] = [];
        const agg = new CspReportAggregator((l) => lines.push(l));
        let accepted = 0;
        for (let i = 0; i < PER_IP_PER_MINUTE + 5; i++) if (agg.accept('1.2.3.4', 1000)) accepted++;
        expect(accepted).toBe(PER_IP_PER_MINUTE);
        expect(agg.accept('5.6.7.8', 1000)).toBe(true);
        expect(agg.accept('1.2.3.4', 61_001)).toBe(true);

        const v = { directive: 'img-src', blocked: 'https://a.example', page: '/' };
        agg.record([v, v, v], 1000);
        expect(lines.length).toBe(0);
        agg.record([v], 62_000);
        expect(lines.length).toBe(1);
        expect(lines[0]).toMatch(/"img-src https:\/\/a\.example \/":4/);
    });

    it('the route answers 204 and never touches the DB', () => {
        const route = read('app/api/csp-report/route.ts');
        expect(route).toMatch(/status: 204/);
        expect(route).not.toMatch(/supabase/i);
    });
});

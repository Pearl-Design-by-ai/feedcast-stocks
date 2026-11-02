/**
 * Security headers for markets.feedcast.news (modelled on www.feedcast.news's
 * lib/security/csp.ts). Plain data so next.config.ts, worker-wrapper.mjs and
 * lib/security/headers.test.ts can all import it — keep this file free of
 * imports.
 *
 * Where each header is applied (see also public/_headers):
 *
 *   - next.config.ts `headers()` → every response Next itself produces: pages,
 *     route handlers under /api/*, redirects, and (under `next start`) static
 *     files.
 *   - public/_headers → files Cloudflare's static-assets layer serves BEFORE the
 *     Worker runs (`/_next/static/*`, `/assets/*`, favicon …). Those never reach
 *     Next, so next.config headers don't apply to them in production.
 *   - worker-wrapper.mjs → `/_next/image`, which OpenNext answers before Next's
 *     routing (so next.config headers never reach it either).
 *
 * The page CSP is ENFORCED: one `Content-Security-Policy` header per page path
 * carrying the full policy plus `frame-ancestors 'self'` (nothing on
 * www.feedcast.news frames markets — it links out in a new tab — so framing is
 * denied to everyone but ourselves) and `report-uri` / `report-to`, so
 * violations still reach /api/csp-report.
 *
 * Rollback switch: CSP_ENFORCE=0 at BUILD time (next.config `headers()` is
 * evaluated during `next build`) restores the previous shape — an enforced
 * `frame-ancestors`-only header plus the full policy as
 * `Content-Security-Policy-Report-Only` (browsers ignore frame-ancestors in a
 * Report-Only policy, hence the split). In production: set the GitHub repo
 * variable CSP_ENFORCE=0 and redeploy (.github/workflows/deploy.yml passes it
 * to the build), or git revert. Unset / any other value = enforced.
 *
 * Why `'unsafe-inline'` for scripts: Next streams its RSC payload as inline
 * <script> tags that differ per page, and the theme bootstrap is inline too,
 * so hashes don't work, and a nonce would require a proxy on every request.
 * The policy still pins every EXTERNAL origin a script, frame or connection
 * may reach.
 */

export const CSP_REPORT_PATH = '/api/csp-report';
/** Reporting API group name (Report-To / Reporting-Endpoints). */
export const CSP_REPORT_GROUP = 'csp';

/**
 * Shared Supabase project (browser client in lib/supabase/client.ts): the
 * project host (REST, auth, realtime websocket) and the shared custom auth
 * domain.
 */
const SUPABASE = ['https://*.supabase.co', 'wss://*.supabase.co', 'https://auth.feedcast.news'];

/** TradingView embeds: loader script from s3, the widget itself in an iframe. */
const TRADINGVIEW_SCRIPT = 'https://s3.tradingview.com';
const TRADINGVIEW_FRAMES = [
  'https://www.tradingview-widget.com',
  'https://s.tradingview.com',
  'https://www.tradingview.com',
];

/** Google Translate element (lib/loadGoogleTranslate.ts), loaded only on demand. */
const TRANSLATE_SCRIPT = [
  'https://translate.google.com',
  'https://translate.googleapis.com',
  'https://translate-pa.googleapis.com',
  'https://www.gstatic.com',
];

export const PAGE_CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", TRADINGVIEW_SCRIPT, ...TRANSLATE_SCRIPT],
  'style-src': ["'self'", "'unsafe-inline'", 'https://translate.googleapis.com', 'https://www.gstatic.com'],
  // Logos come from Finnhub, ibb, LinkedIn, Google Translate's sprites… and
  // the Cloudflare image loader rewrites them to same-origin /cdn-cgi/image.
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  // next/font self-hosts Geist / Space Grotesk.
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    ...SUPABASE,
    'https://translate.googleapis.com',
    'https://translate-pa.googleapis.com',
  ],
  'frame-src': ["'self'", ...TRADINGVIEW_FRAMES, 'https://translate.google.com'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export function serializeCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
    .join('; ');
}

/** Only we may frame ourselves. */
export const FRAME_ANCESTORS_SITE = "frame-ancestors 'self'";

const REPORT_DIRECTIVES = `report-uri ${CSP_REPORT_PATH}; report-to ${CSP_REPORT_GROUP}`;

/** The enforced page policy: full policy + frame-ancestors + where to send reports. */
export function pageCspEnforced(): string {
  return `${serializeCsp(PAGE_CSP_DIRECTIVES)}; ${FRAME_ANCESTORS_SITE}; ${REPORT_DIRECTIVES}`;
}

/** The Report-Only page policy (CSP_ENFORCE=0 fallback), including where to send reports. */
export function pageCspReportOnly(): string {
  return `${serializeCsp(PAGE_CSP_DIRECTIVES)}; ${REPORT_DIRECTIVES}`;
}

/**
 * Whether the page CSP is enforced: true unless CSP_ENFORCE is exactly "0".
 * Read via a defaulted parameter so this file stays import-free and safe where
 * `process` doesn't exist.
 */
export function cspEnforced(
  flag: string | undefined = typeof process !== 'undefined' ? process.env.CSP_ENFORCE : undefined,
): boolean {
  return flag !== '0';
}
/** Enforced on /api/*: JSON / 204 responses never render, never get framed. */
export const API_CSP = "default-src 'none'; frame-ancestors 'none'";
/** Image responses (/_next/image): no script, no subresources, sandboxed. */
export const IMAGE_CSP = "default-src 'none'; sandbox";

export const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()';

export type HeaderPair = { key: string; value: string };
export type HeaderRule = { source: string; headers: HeaderPair[] };

/** Sent on every response, whatever serves it (Next, Worker wrapper, static assets). */
export const BASE_SECURITY_HEADERS: HeaderPair[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
];

function pageCspHeaders(enforce: boolean): HeaderPair[] {
  const reporting = { key: 'Reporting-Endpoints', value: `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"` };
  if (enforce) return [{ key: 'Content-Security-Policy', value: pageCspEnforced() }, reporting];
  return [
    { key: 'Content-Security-Policy', value: FRAME_ANCESTORS_SITE },
    { key: 'Content-Security-Policy-Report-Only', value: pageCspReportOnly() },
    reporting,
  ];
}

/**
 * /api routes (path below /api/, no leading slash) that send their OWN
 * Content-Security-Policy. next.config headers OVERRIDE a route handler's
 * header of the same name (verified on `next start`, Next 16.4), so such a
 * route must be listed here to keep its stricter policy. headers.test.ts
 * scans app/api for route handlers setting a CSP and fails if one is missing.
 */
export const OWN_CSP_API_ROUTES: string[] = [];

/** `/api/:path*`, minus OWN_CSP_API_ROUTES (each with all of its sub-paths). */
function apiCspSource(): string {
  if (OWN_CSP_API_ROUTES.length === 0) return '/api/:path*';
  const alt = OWN_CSP_API_ROUTES.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return `/api/((?!(?:${alt})(?:/|$)).*)`;
}

/**
 * next.config.ts header rules. The base set matches every path; the CSP rules
 * are disjoint (pages vs /api/*), so exactly one rule sets each CSP header per
 * path. `enforce` defaults from CSP_ENFORCE (see cspEnforced).
 */
export function securityHeaderRules(enforce: boolean = cspEnforced()): HeaderRule[] {
  return [
    { source: '/:path*', headers: BASE_SECURITY_HEADERS },
    { source: '/((?!api(?:/|$)).*)', headers: pageCspHeaders(enforce) },
    { source: apiCspSource(), headers: [{ key: 'Content-Security-Policy', value: API_CSP }] },
  ];
}

/**
 * Adds the base set + the image CSP to a Worker-produced image response
 * without overwriting anything the response already sets.
 */
export function withImageSecurityHeaders(headers: Headers): Headers {
  for (const { key, value } of BASE_SECURITY_HEADERS) if (!headers.has(key)) headers.set(key, value);
  if (!headers.has('Content-Security-Policy')) headers.set('Content-Security-Policy', IMAGE_CSP);
  return headers;
}

/** public/_headers body for Cloudflare static assets (checked by the test). */
export function staticAssetHeadersFile(): string {
  return ['/*', ...BASE_SECURITY_HEADERS.map((h) => `  ${h.key}: ${h.value}`)].join('\n');
}

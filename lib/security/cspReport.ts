/**
 * /api/csp-report intake (ported from www.feedcast.news): parse both report formats, reduce each violation to
 * a low-cardinality key, rate-limit, and log in aggregate (security audit
 * 2026-10-25, M2). Pure + in-memory; lib/security/headers.test.ts covers it.
 *
 * Reports are anonymous and untrusted, so: no DB writes, no full URLs logged
 * (only the blocked ORIGIN and the page PATH — query strings can carry tokens),
 * a small per-IP and per-isolate budget, and one summary line per minute
 * instead of a line per report.
 */

export const MAX_REPORT_BYTES = 16 * 1024;
export const PER_IP_PER_MINUTE = 10;
export const GLOBAL_PER_MINUTE = 300;

export interface CspViolation {
  directive: string;
  blocked: string;
  page: string;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Blocked URL → origin, or the CSP keyword ('inline', 'eval', 'data' …). */
export function blockedKey(raw: string): string {
  const v = raw.trim();
  if (!v) return 'unknown';
  if (/^(inline|eval|wasm-eval|trusted-types-policy|trusted-types-sink)$/i.test(v)) return v.toLowerCase();
  try {
    const u = new URL(v);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'wss:' || u.protocol === 'ws:') return u.origin;
    return u.protocol.replace(/:$/, '');
  } catch {
    return v.slice(0, 40).replace(/[^\w.:/-]/g, '_');
  }
}

function pagePath(raw: string): string {
  try {
    return new URL(raw).pathname.slice(0, 120);
  } catch {
    return '?';
  }
}

function fromLegacy(r: Record<string, unknown>): CspViolation {
  return {
    directive: (str(r['effective-directive']) || str(r['violated-directive']).split(' ')[0] || 'unknown').slice(0, 40),
    blocked: blockedKey(str(r['blocked-uri'])),
    page: pagePath(str(r['document-uri'])),
  };
}

function fromReportingApi(b: Record<string, unknown>): CspViolation {
  return {
    directive: (str(b.effectiveDirective) || 'unknown').slice(0, 40),
    blocked: blockedKey(str(b.blockedURL)),
    page: pagePath(str(b.documentURL)),
  };
}

/**
 * Accepts `application/csp-report` ({"csp-report": {...}}) and
 * `application/reports+json` ([{type:"csp-violation", body:{...}}]). Returns
 * [] for anything else.
 */
export function parseCspReports(text: string): CspViolation[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && 'csp-report' in data) {
    const r = (data as Record<string, unknown>)['csp-report'];
    return r && typeof r === 'object' ? [fromLegacy(r as Record<string, unknown>)] : [];
  }
  if (Array.isArray(data)) {
    return data
      .slice(0, 20)
      .filter((e) => e && typeof e === 'object' && (e as Record<string, unknown>).type === 'csp-violation')
      .map((e) => (e as Record<string, unknown>).body)
      .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
      .map(fromReportingApi);
  }
  return [];
}

/** Per-isolate counters. A fresh isolate starts empty — this is a budget, not an audit trail. */
export class CspReportAggregator {
  private windowStart = 0;
  private global = 0;
  private perIp = new Map<string, number>();
  private counts = new Map<string, number>();
  private lastFlush = 0;

  constructor(private log: (line: string) => void = (l) => console.log(l)) {}

  /** true if this report is within budget (and was counted). */
  accept(ip: string, now: number): boolean {
    if (now - this.windowStart >= 60_000) {
      this.windowStart = now;
      this.global = 0;
      this.perIp.clear();
    }
    const mine = this.perIp.get(ip) ?? 0;
    if (mine >= PER_IP_PER_MINUTE || this.global >= GLOBAL_PER_MINUTE) return false;
    this.perIp.set(ip, mine + 1);
    this.global++;
    return true;
  }

  record(violations: CspViolation[], now: number): void {
    for (const v of violations) {
      const key = `${v.directive} ${v.blocked} ${v.page}`;
      this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
      if (this.counts.size > 500) break;
    }
    if (this.lastFlush === 0) this.lastFlush = now;
    if (now - this.lastFlush >= 60_000 || this.counts.size >= 200) this.flush(now);
  }

  flush(now: number): void {
    if (this.counts.size === 0) return;
    const top = [...this.counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
    this.log(`[csp-report] ${JSON.stringify(Object.fromEntries(top))}`);
    this.counts.clear();
    this.lastFlush = now;
  }
}

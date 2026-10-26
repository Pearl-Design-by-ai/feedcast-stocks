import { NextRequest } from 'next/server';
import { CspReportAggregator, MAX_REPORT_BYTES, parseCspReports } from '@/lib/security/cspReport';

/**
 * CSP violation reports from the Report-Only page policy
 * (lib/security/headers.ts). Same-origin on purpose: www.feedcast.news has its
 * own intake, but the Reporting API needs CORS for a cross-origin endpoint.
 * Anonymous, so: in-memory budget per IP and per isolate, no DB, aggregate log
 * lines only (`[csp-report] {...}` in Workers logs). Always 204 — a browser
 * must never retry or surface an error for a report.
 */
export const dynamic = 'force-dynamic';

const aggregator = new CspReportAggregator();
const NO_CONTENT = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

/** Body as text, or null if it is unreadable or exceeds `cap` bytes (stops reading at the cap). */
async function readCapped(req: NextRequest, cap: number): Promise<string | null> {
    if (!req.body) return '';
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > cap) {
                await reader.cancel().catch(() => {});
                return null;
            }
            chunks.push(value);
        }
    } catch {
        return null;
    }
    const buf = new Uint8Array(size);
    let off = 0;
    for (const c of chunks) {
        buf.set(c, off);
        off += c.byteLength;
    }
    return new TextDecoder().decode(buf);
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    if (!aggregator.accept(ip, now)) return NO_CONTENT();

    const declared = Number(req.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_REPORT_BYTES) return NO_CONTENT();
    const text = await readCapped(req, MAX_REPORT_BYTES);
    if (text === null) return NO_CONTENT();

    aggregator.record(parseCspReports(text), now);
    return NO_CONTENT();
}

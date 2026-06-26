import { NextRequest, NextResponse } from 'next/server';
import { getDiagnostics } from '@/lib/actions/admin.actions';
import { runValuationScan } from '@/lib/actions/valuation.actions';

/**
 * Markets-health bridge for the FeedCast (news) system monitor.
 *
 * The single ops "health" email is sent by the FeedCast app, which queries its
 * own Supabase and can't see the markets data plane (this app + the private
 * markets-engine). This route is the cross-app seam: a secret-gated JSON probe
 * the FeedCast monitor calls so markets-data freshness lands in the same inbox
 * digest, and a POST refresh lever its auto-remediation fires when the staleness
 * is the rebuildable kind.
 *
 *   GET  → compact freshness summary derived from the engine diagnostics, with a
 *          single `status` (ok|warning|critical) tuned for "should this page the
 *          operator / trigger a fix" and a `rebuildable` flag.
 *   POST → advance/rebuild the stored valuation screen (idempotent; the only
 *          markets staleness a server-side action can actually fix — upstream
 *          Yahoo/Finnhub lag is reported, never force-fixed).
 *
 * Auth: a shared bearer secret (MARKETS_HEALTH_SECRET) the FeedCast app also
 * holds. Kept distinct from this app's CRON_SECRET so the engine token never
 * leaves this app and FeedCast only ever sees this thin summary.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Status = 'ok' | 'warning' | 'critical';

interface MarketsHealthSummary {
    status: Status;
    /** True only when a valuation-screen rebuild (POST here) can actually fix it.
     *  Upstream feed lag (Yahoo/Finnhub) is never rebuildable — report only. */
    rebuildable: boolean;
    reason: string;
    overall: 'healthy' | 'degraded' | 'down' | 'unreachable';
    session: string | null;
    eod: { expectedSession: string; staleCount: number; downCount: number } | null;
    finnhub: 'ok' | 'down' | 'unconfigured' | 'unknown';
    valuation: { built: boolean; complete: boolean; session: string | null } | null;
    checkedAt: string;
}

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.MARKETS_HEALTH_SECRET;
    if (!secret) return false;
    return (request.headers.get('authorization') ?? '') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkedAt = new Date().toISOString();
    const diag = await getDiagnostics();

    // Engine unconfigured/unreachable — the whole markets data plane is dark.
    if (!diag) {
        const summary: MarketsHealthSummary = {
            status: 'critical',
            rebuildable: false,
            reason: 'Markets engine unreachable or unconfigured — no diagnostics returned.',
            overall: 'unreachable',
            session: null,
            eod: null,
            finnhub: 'unknown',
            valuation: null,
            checkedAt,
        };
        return NextResponse.json(summary, { status: 200 });
    }

    const finnhub = (diag.feeds.find((f) => f.key === 'finnhub')?.status ?? 'unknown') as
        | MarketsHealthSummary['finnhub'];
    const eodDown = diag.eod.downCount > 0;
    const eodStale = diag.eod.staleCount > 0;
    const valuationBehindHard =
        diag.valuation.built &&
        diag.valuation.complete &&
        !!diag.valuation.session &&
        diag.valuation.session !== diag.session;
    const valuationMidBuild = diag.valuation.built && !diag.valuation.complete;

    let status: Status = 'ok';
    let rebuildable = false;
    let reason = 'All markets feeds current.';

    // Priority order: hardest user-visible breakage first. Upstream outages
    // (Yahoo/Finnhub) page the operator but aren't rebuildable; a behind stored
    // valuation screen is the one case a scan repairs.
    if (eodDown) {
        status = 'critical';
        reason = `Yahoo EOD feed down — ${diag.eod.downCount} symbol(s) returned no data (upstream outage).`;
    } else if (finnhub === 'down') {
        status = 'critical';
        reason = 'Finnhub quote feed down — live watchlist quotes are stale. Check FINNHUB_API_KEY / free-tier quota.';
    } else if (valuationBehindHard) {
        status = 'critical';
        rebuildable = true;
        reason = `Valuation screen built for ${diag.valuation.session}, a session behind ${diag.session} — a scan rebuilds it.`;
    } else if (eodStale) {
        status = 'warning';
        reason = `${diag.eod.staleCount} EOD series a session behind ${diag.session} — usually a market holiday or brief upstream lag.`;
    } else if (valuationMidBuild) {
        status = 'warning';
        rebuildable = true;
        reason = `Valuation screen mid-build (${diag.valuation.scanned ?? '?'}/${diag.valuation.universe ?? '?'}) — next scan tick completes it.`;
    }

    const summary: MarketsHealthSummary = {
        status,
        rebuildable,
        reason,
        overall: diag.overall,
        session: diag.session,
        eod: {
            expectedSession: diag.eod.expectedSession,
            staleCount: diag.eod.staleCount,
            downCount: diag.eod.downCount,
        },
        finnhub,
        valuation: {
            built: diag.valuation.built,
            complete: diag.valuation.complete,
            session: diag.valuation.session,
        },
        checkedAt,
    };
    return NextResponse.json(summary, { status: 200 });
}

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const screen = await runValuationScan();
        if (!screen) {
            return NextResponse.json({ ok: false, error: 'Engine unavailable' }, { status: 503 });
        }
        return NextResponse.json({
            ok: true,
            scanned: screen.scanned,
            universe: screen.universe,
            complete: screen.complete,
            session: screen.session,
            asOf: screen.asOf,
        });
    } catch (err) {
        console.error('health/markets refresh failed', err);
        return NextResponse.json({ ok: false, error: 'Scan failed' }, { status: 500 });
    }
}

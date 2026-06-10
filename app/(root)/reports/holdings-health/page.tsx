import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getWatchlistData, type WatchlistStockData } from '@/lib/actions/finnhub.actions';
import {
    ReportHeader,
    Section,
    StatCard,
    SignalBadge,
    BottomLine,
    ChangeCell,
    fmtPrice,
    fmtPct,
} from '@/components/reports/ReportUi';
import { getReport, type ReportTone } from '@/lib/reports';
import { reportTimestamp } from '@/lib/reports-data';

export const metadata: Metadata = {
    title: 'Holdings Health',
    description:
        'A live technical health check across your watchlist — every symbol triaged by today’s move, with a suggested next step.',
};

const report = getReport('holdings-health')!;

interface Triage {
    grade: string;
    tone: ReportTone;
    action: string;
}

// Triage by today's % move. Deliberately coarse — with quote data only (no
// history), the honest read is the size of today's move, not trend claims.
function triage(dp: number): Triage {
    if (dp >= 5)
        return {
            grade: 'Surge',
            tone: 'pos',
            action: 'Big up day — tighten the trailing stop or take partial profits into strength.',
        };
    if (dp >= 2)
        return {
            grade: 'Strong',
            tone: 'pos',
            action: 'Solid advance — ratchet your stop up behind the move.',
        };
    if (dp > -2)
        return {
            grade: 'Calm',
            tone: 'neutral',
            action: 'Normal daily noise — no action needed.',
        };
    if (dp > -5)
        return {
            grade: 'Weak',
            tone: 'warn',
            action: 'Notable down day — check the close against your support level.',
        };
    return {
        grade: 'Sharp drop',
        tone: 'neg',
        action: 'Outsized decline — check for news and review the position and stop now, not later.',
    };
}

function fmtMarketCap(millions?: number): string {
    if (!millions) return '—';
    if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(2)}T`;
    if (millions >= 1_000) return `$${(millions / 1_000).toFixed(1)}B`;
    return `$${millions.toFixed(0)}M`;
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center">
            <p className="max-w-md text-sm text-gray-400">
                Your watchlist is empty, so there is nothing to scan yet. Add the symbols you own
                or follow and this report will triage them on every open.
            </p>
            <Link
                href="/watchlist"
                className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-sky-400 transition-colors hover:bg-gray-700"
            >
                <Plus size={15} />
                Build your watchlist
            </Link>
        </div>
    );
}

function HealthTable({ rows }: { rows: Array<WatchlistStockData & Triage> }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2">Today</th>
                        <th className="px-3 py-2">Mkt cap</th>
                        <th className="px-3 py-2">P/E</th>
                        <th className="px-3 py-2">Grade</th>
                        <th className="px-3 py-2">Suggested next step</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.symbol} className="border-b border-gray-800/60 hover:bg-gray-900/60">
                            <td className="px-3 py-2.5">
                                <Link
                                    href={`/stocks/${row.symbol}`}
                                    className="font-semibold text-gray-100 transition-colors hover:text-sky-400"
                                >
                                    {row.symbol}
                                </Link>
                                <div className="max-w-[180px] truncate text-xs text-gray-500">{row.name}</div>
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-200">
                                {row.price ? fmtPrice(row.price) : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                                <ChangeCell changePercent={row.changePercent} />
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-400">{fmtMarketCap(row.marketCap)}</td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-400">
                                {row.peRatio != null ? row.peRatio.toFixed(1) : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                                <SignalBadge tone={row.tone}>{row.grade}</SignalBadge>
                            </td>
                            <td className="max-w-[280px] px-3 py-2.5 text-xs leading-relaxed text-gray-400">
                                {row.action}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

async function HealthData({ userId }: { userId: string }) {
    const items = await getUserWatchlist(userId);
    if (items.length === 0) return <EmptyState />;

    const data = await getWatchlistData(items.map((i) => i.symbol));
    const rows = data
        .map((d) => ({
            ...d,
            // No live quote → no grade; grading a missing price as "Calm" would mislead.
            ...(d.price == null
                ? {
                      grade: 'No data',
                      tone: 'neutral' as const,
                      action: 'Live quote unavailable right now — reload the report to retry.',
                  }
                : triage(d.changePercent)),
        }))
        .sort((a, b) => b.changePercent - a.changePercent);

    const advancers = rows.filter((r) => r.changePercent > 0).length;
    const decliners = rows.filter((r) => r.changePercent < 0).length;
    const sharp = rows.filter((r) => Math.abs(r.changePercent) >= 5);
    const best = rows[0];
    const worst = rows[rows.length - 1];

    const tone: ReportTone =
        sharp.some((r) => r.changePercent <= -5)
            ? 'neg'
            : decliners > advancers
              ? 'warn'
              : 'pos';

    return (
        <>
            <Section title="Exec grid" subtitle="The whole book at a glance.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Symbols scanned" value={String(rows.length)} sub="From your watchlist" />
                    <StatCard
                        label="Advancing"
                        value={String(advancers)}
                        sub="Up today"
                        tone={advancers > 0 ? 'pos' : 'neutral'}
                    />
                    <StatCard
                        label="Declining"
                        value={String(decliners)}
                        sub="Down today"
                        tone={decliners > 0 ? 'neg' : 'neutral'}
                    />
                    <StatCard
                        label="Sharp movers"
                        value={String(sharp.length)}
                        sub="±5% or more"
                        tone={sharp.length > 0 ? 'warn' : 'pos'}
                    />
                    <StatCard
                        label="Spread"
                        value={`${fmtPct(best.changePercent)} / ${fmtPct(worst.changePercent)}`}
                        sub={`${best.symbol} best · ${worst.symbol} worst`}
                    />
                </div>
            </Section>

            <Section
                title="Triage board"
                subtitle="Every symbol graded by today’s move, best to worst. Grades reflect today only — not a long-term rating."
            >
                <HealthTable rows={rows} />
            </Section>

            <BottomLine tone={tone}>
                {sharp.length > 0
                    ? `${sharp.length} symbol${sharp.length > 1 ? 's' : ''} moved ±5%+ today (${sharp.map((r) => r.symbol).join(', ')}) — start there: sharp moves are where a plan earns its keep. The rest of the book is routine.`
                    : decliners > advancers
                      ? `A soft day for the book — ${decliners} of ${rows.length} names are red, but nothing crossed the sharp-move line. Check the “Weak” rows against your support levels and leave the rest alone.`
                      : `A quiet, constructive day — ${advancers} of ${rows.length} names are green and nothing needs urgent attention. The best action on a day like this is usually none.`}
            </BottomLine>
        </>
    );
}

export default async function HoldingsHealthPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('https://www.feedcast.news/?signin=stocks');

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ReportHeader report={report} timestamp={reportTimestamp()} />

            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                        Scanning your watchlist…
                    </div>
                }
            >
                <HealthData userId={user.id} />
            </Suspense>
        </div>
    );
}

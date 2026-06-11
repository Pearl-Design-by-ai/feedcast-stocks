import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, Rocket, LifeBuoy, Mountain } from 'lucide-react';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getAnalysisTool, SCAN_UNIVERSE } from '@/lib/analysis';
import {
    ToolHeader,
    Section,
    SignalBadge,
    BottomLine,
} from '@/components/analysis/AnalysisUi';
import { momentum, rsi, highestClose, fmtSignedPct, fmtUsd } from '@/lib/technical';

export const metadata: Metadata = {
    title: 'Opportunity Scan',
    description:
        'A daily EOD sweep across liquid US names — momentum leaders, oversold bounce candidates and 52-week-high breakout watch.',
};

const tool = getAnalysisTool('opportunity-scan')!;

interface ScanRow {
    symbol: string;
    last: number;
    m1: number | null;
    rsi14: number | null;
    offHigh: number | null;
}

async function scanSymbol(symbol: string): Promise<ScanRow | null> {
    const series = await fetchDailyCloses(symbol);
    const closes = series.map((c) => c.close);
    if (closes.length < 60) return null;
    const last = closes[closes.length - 1];
    const high52 = highestClose(closes, 252);
    return {
        symbol,
        last,
        m1: momentum(closes, 21),
        rsi14: rsi(closes, 14),
        offHigh: high52 ? (last / high52 - 1) * 100 : null,
    };
}

// Bounded pool — 24 Yahoo fetches (cached 6h after the first run of the day).
async function runScan(): Promise<ScanRow[]> {
    const out: ScanRow[] = [];
    let next = 0;
    async function worker() {
        while (next < SCAN_UNIVERSE.length) {
            const sym = SCAN_UNIVERSE[next++];
            try {
                const row = await scanSymbol(sym);
                if (row) out.push(row);
            } catch {
                // One bad symbol shouldn't kill the sweep.
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return out;
}

function RowLine({ row, metric }: { row: ScanRow; metric: string }) {
    return (
        <Link
            href={`/stocks/${row.symbol}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3.5 py-2.5 transition-colors hover:bg-gray-800/80"
        >
            <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-100">{row.symbol}</span>
                <span className="text-xs tabular-nums text-gray-500">{fmtUsd(row.last)}</span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-gray-300">{metric}</span>
        </Link>
    );
}

async function ScanResults() {
    const rows = await runScan();

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center text-sm text-gray-500">
                The scan couldn’t fetch price history right now — try again in a minute.
            </div>
        );
    }

    const leaders = rows
        .filter((r) => (r.m1 ?? -Infinity) > 0)
        .sort((a, b) => (b.m1 ?? 0) - (a.m1 ?? 0))
        .slice(0, 6);
    const oversold = rows
        .filter((r) => r.rsi14 != null && r.rsi14 < 35)
        .sort((a, b) => (a.rsi14 ?? 0) - (b.rsi14 ?? 0))
        .slice(0, 6);
    const nearHigh = rows
        .filter((r) => r.offHigh != null && r.offHigh > -3)
        .sort((a, b) => (b.offHigh ?? -99) - (a.offHigh ?? -99))
        .slice(0, 6);

    return (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Section
                    title="Momentum leaders"
                    subtitle="Strongest 1-month moves in the universe — strength begets strength, until it doesn't."
                >
                    <div className="mb-3">
                        <Rocket size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {leaders.length > 0 ? (
                            leaders.map((r) => (
                                <RowLine key={r.symbol} row={r} metric={fmtSignedPct(r.m1 ?? 0)} />
                            ))
                        ) : (
                            <p className="text-xs text-gray-500">Nothing positive this month — defensive tape.</p>
                        )}
                    </div>
                </Section>

                <Section
                    title="Oversold bounce watch"
                    subtitle="RSI(14) under 35 — washed-out names where mean-reversion setups form. Falling knives included; catch with rules."
                >
                    <div className="mb-3">
                        <LifeBuoy size={16} className="text-amber-400" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {oversold.length > 0 ? (
                            oversold.map((r) => (
                                <RowLine key={r.symbol} row={r} metric={`RSI ${r.rsi14!.toFixed(0)}`} />
                            ))
                        ) : (
                            <p className="text-xs text-gray-500">
                                Nothing washed out — no one in the universe is oversold today.
                            </p>
                        )}
                    </div>
                </Section>

                <Section
                    title="Breakout watch"
                    subtitle="Within 3% of the 52-week high — new highs come from this neighborhood."
                >
                    <div className="mb-3">
                        <Mountain size={16} className="text-sky-400" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {nearHigh.length > 0 ? (
                            nearHigh.map((r) => (
                                <RowLine key={r.symbol} row={r} metric={fmtSignedPct(r.offHigh ?? 0)} />
                            ))
                        ) : (
                            <p className="text-xs text-gray-500">
                                No one is pressing the highs — the universe trades below its peaks.
                            </p>
                        )}
                    </div>
                </Section>
            </div>

            <BottomLine
                tone={leaders.length >= nearHigh.length && leaders.length > oversold.length ? 'pos' : oversold.length > leaders.length ? 'warn' : 'neutral'}
            >
                Scanned {rows.length} liquid names on end-of-day data: {leaders.length} momentum
                leader{leaders.length === 1 ? '' : 's'}, {oversold.length} oversold,{' '}
                {nearHigh.length} pressing 52-week highs. A scan finds candidates — Trend Check and
                Swing Scout (one click from any row’s detail page) decide if they’re trades.{' '}
                <SignalBadge tone="neutral">EOD data</SignalBadge>
            </BottomLine>
        </>
    );
}

export default function OpportunityScanPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ToolHeader tool={tool} />
            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        Sweeping {SCAN_UNIVERSE.length} names…
                    </div>
                }
            >
                <ScanResults />
            </Suspense>
        </div>
    );
}

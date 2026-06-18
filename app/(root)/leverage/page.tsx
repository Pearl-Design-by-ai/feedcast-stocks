import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2, Rocket } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import { LeveragePairCard, BacktestSection } from '@/components/leverage/LeverageUi';
import { getLeverageReport } from '@/lib/actions/leverage.actions';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isPowerUserEmail } from '@/lib/constants';
import { cn, formatEodDate } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Leverage Rotation',
};

const VIX_TONE = (vix: number | null) =>
    vix == null ? 'text-gray-300' : vix < 16 ? 'text-emerald-400' : vix < 22 ? 'text-gray-300' : 'text-red-400';

async function Leverage() {
    const r = await getLeverageReport();

    if (!r || r.pairs.length === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Leverage data is unavailable right now — please check back shortly.
            </div>
        );
    }

    return (
        <>
            {/* Volatility backdrop — the master risk switch for leverage */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Volatility backdrop · VIX</p>
                        <p className={cn('text-2xl font-bold tabular-nums', VIX_TONE(r.vix))}>{r.vix != null ? r.vix.toFixed(1) : '—'}</p>
                    </div>
                    <span className="text-[11px] text-gray-500">Data through {formatEodDate(r.dataDate)} close (EOD) · refreshed {r.asOf} ET</span>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-gray-400">{r.vixNote}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {r.pairs.map((p) => (
                    <LeveragePairCard key={p.key} p={p} />
                ))}
            </div>

            {r.backtest && <BacktestSection bt={r.backtest} />}

            <p className="text-[10px] leading-relaxed text-gray-600">{r.disclaimer}</p>
        </>
    );
}

function Skeleton() {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            Sizing the 1x↔3x rotation from end-of-day trend, momentum and the volatility backdrop…
        </div>
    );
}

export default async function LeveragePage() {
    // Power-user-only screen. The group layout already gates members; this one is
    // restricted further to the owner account, and hidden (404) for everyone else.
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isPowerUserEmail(user?.email)) notFound();

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                        <Rocket className="text-violet-400" /> Leverage Rotation
                    </h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Always fully invested — but rotating between the <strong className="text-gray-200">1x ETF and its 3x sibling</strong>{' '}
                        (QQQ ↔ TQQQ, SPY ↔ SPXL) as the tape changes. Each card gives you a recommended split and the{' '}
                        <strong className="text-gray-200">effective market exposure</strong> it implies, scored from the primary trend
                        (200-day), the 50/200 structure, RSI momentum, distance from the highs and — above all — the VIX, since daily-reset
                        decay is what punishes leverage in choppy markets. The ladder tells you when to lever up and when to drop to the 1x.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <Suspense fallback={<Skeleton />}>
                <Leverage />
            </Suspense>

            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-2 text-base font-semibold text-gray-100">How the split is decided</h2>
                <p className="text-xs leading-relaxed text-gray-400">
                    A 0–100 leverage score gates 3x exposure on the primary trend: <strong className="text-gray-200">below the 200-day,
                    leverage is pulled to the floor</strong> (you sit in the 1x), because that&apos;s where leveraged funds bleed worst.
                    Above the 200-day it scales up with the 50/200 structure, healthy RSI and proximity to the highs — then the VIX trims
                    it back: calm adds leverage, elevated/high volatility cuts it hard. The score maps to a{' '}
                    <span className="text-violet-300">3x weight</span>; the rest stays in the 1x so you&apos;re never in cash.
                    100% in the 3x is only reachable in a clean, calm uptrend pressing new highs.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                    Computed from end-of-day closes (cached up to 30min), so it moves once per trading day after the US close —
                    a level-based playbook, not a price prediction. Leveraged ETFs are high-risk. Heuristic and informational only —{' '}
                    <span className="text-gray-400">not investment advice.</span>
                </p>
            </section>
        </div>
    );
}

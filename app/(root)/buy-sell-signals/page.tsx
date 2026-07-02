import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, Signal } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import ToneAura from '@/components/ToneAura';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import RelatedLinks from '@/components/common/RelatedLinks';
import Collapsible from '@/components/common/Collapsible';
import { SignalCard, MacroStrip, SectorBoard, RecoveryStats, WhyMarketsRise, TacticalCard, SmartMoneyBoard } from '@/components/signals/SignalsUi';
import { getSignalsReport } from '@/lib/signals-scan';
import { getSparks } from '@/lib/actions/sparks.actions';
import { cn, formatEodDate } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Buy & Sell Signals',
};

const TONE_TEXT = { pos: 'text-emerald-400', neutral: 'text-amber-400', neg: 'text-red-400' } as const;

async function Signals() {
    const r = await getSignalsReport();

    if (!r || r.indices.length === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Signal data is unavailable right now — please check back shortly.
            </div>
        );
    }

    const { indices, sectors, macro, tone, asOf, dataDate, tactical, smartMoney } = r;

    // 30-day shapes for the index cards + sector rows — one cached engine call.
    const sparks = await getSparks([...indices, ...sectors].map((s) => s.symbol));

    return (
        <>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Overall index tape</p>
                        <p className={cn('text-2xl font-bold', TONE_TEXT[tone.tone])}>{tone.label}</p>
                    </div>
                    <span className="text-[11px] text-gray-500">Data through {formatEodDate(dataDate)} close (EOD) · refreshed {asOf} ET</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">{tone.note}</p>
            </div>

            {tactical && <TacticalCard t={tactical} />}

            <MacroStrip macro={macro} />

            {smartMoney && <SmartMoneyBoard sm={smartMoney} />}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {indices.map((s) => (
                    <SignalCard key={s.key} s={s} spark={sparks[s.symbol]} />
                ))}
            </div>

            <SectorBoard sectors={sectors} sparks={sparks} />
        </>
    );
}

function Skeleton() {
    return (
        <div className="fc-shimmer flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            Scoring the indices — trend, momentum and key levels from end-of-day data…
        </div>
    );
}

/** Curated market-history context — served by the engine alongside the report. */
async function SignalsContext() {
    const r = await getSignalsReport();
    if (!r) return null;
    return (
        <>
            <RecoveryStats stats={r.correctionStats} />
            <WhyMarketsRise reasons={r.whyMarketsRise} />
        </>
    );
}

export default function BuySellSignalsPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <Suspense fallback={null}>
                <ToneAura />
            </Suspense>
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                        <Signal className="text-teal-400" /> Buy &amp; Sell Signals
                    </h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">Buy, hold, or sell the major US indices — right now?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Graded <strong className="text-gray-200">Buy / Hold / Sell</strong> calls for the four major
                        US indices — S&amp;P 500, Nasdaq, Russell 2000 and the Dow — from a transparent blend of trend,
                        the 50/200 structure, RSI momentum, multi-window returns and position vs the 52-week high.
                        Each card shows the key support/resistance levels and a plain-language read of what to expect
                        next session off the latest close.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <ScoreMethodology
                methodology="A 0–100 signal score per index starts neutral at 50, then adds/subtracts for primary trend (price vs the 200-day), short-term trend (vs the 50-day), the 50/200 cross, RSI-14 momentum (with overbought-fade and oversold-bounce adjustments), 1-/3-month and 1-week returns, and distance from the 52-week high. Full detail in “How the grade is built” below."
                cadence="Computed from end-of-day closes (cached up to ~6h), so grades move once per trading day after the US close. The “next-session read” is a level-based scenario, not a price prediction."
                thresholds="Strong Buy ≥72 · Buy 60–72 · Hold 45–60 · Sell 33–45 · Strong Sell <33."
            />

            <Suspense fallback={<Skeleton />}>
                <Signals />
            </Suspense>

            <Suspense fallback={null}>
                <SignalsContext />
            </Suspense>

            <Collapsible
                className="rounded-xl border border-gray-800 bg-gray-900/40"
                header={<h2 className="text-base font-semibold text-gray-100">How the grade is built</h2>}
            >
                <p className="text-xs leading-relaxed text-gray-400">
                    A 0–100 signal score starts neutral at 50 and adds/subtracts for: primary trend (price vs the
                    200-day), short-term trend (vs the 50-day), the 50/200 cross, RSI-14 momentum (with an
                    overbought fade and oversold-bounce adjustment), 1-/3-month and 1-week returns, and distance
                    from the 52-week high. The score maps to <span className="text-emerald-400">Strong Buy</span> (≥72),
                    Buy (60–72), <span className="text-amber-400">Hold</span> (45–60), Sell (33–45) and{' '}
                    <span className="text-red-400">Strong Sell</span> (&lt;33).
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                    Signals are computed from end-of-day closes (cached up to 6h), so they move once per trading day
                    after the US close — the &quot;next-session read&quot; is a level-based scenario, not a price
                    prediction. Heuristic and informational only — <span className="text-gray-400">not investment
                    advice.</span>
                </p>
            </Collapsible>

            <RelatedLinks
                items={[
                    { href: '/market-regime', label: 'Market Regime', desc: 'Confirm the index calls against the overall risk read' },
                    { href: '/sectors', label: 'Sectors', desc: 'Drill from the index tape into sector leadership' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Apply the read to the names you actually hold' },
                    { href: '/alerts', label: 'Set alerts', desc: 'Get notified when a key level breaks' },
                ]}
            />
        </div>
    );
}

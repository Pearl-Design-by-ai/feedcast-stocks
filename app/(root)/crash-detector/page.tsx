import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, Siren, ExternalLink, FileText } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import {
    CrashGauge,
    ProbabilityTable,
    Scorecard,
    CycleClock,
    HistoricalTable,
    ScenarioTimeline,
    ReasonsColumns,
    DriversStrip,
} from '@/components/crash/CrashUi';
import { runCrashScan } from '@/lib/crash-scan';
import { CRASH_SOURCES } from '@/lib/crash';

export const metadata: Metadata = {
    title: 'Crash Detector',
    description:
        'An institutional cycle-risk report: a 0–100 Crash Detector Score, probability table, indicator scorecard, the long-cycle clock and historical analogs — computed from live market data, balanced on both sides.',
};

async function Report() {
    const r = await runCrashScan();

    return (
        <>
            {/* Executive summary + headline score */}
            <CrashGauge
                score={r.score}
                band={r.band}
                asOf={r.asOf}
                liveCount={r.liveCount}
                structuralCount={r.structuralCount}
                summary={r.summary}
            />

            <DriversStrip drivers={r.topDrivers} disagreements={r.disagreements} />

            {/* Probability model */}
            <section className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-gray-100">Probability model</h2>
                <ProbabilityTable p={r.probabilities} />
            </section>

            {/* Indicator scorecard */}
            <section className="flex flex-col gap-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-100">Indicator scorecard</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Every signal classified Bullish → Neutral → Bearish → Extreme Risk.
                        <span className="ml-1 rounded bg-teal-400/10 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-300">Live</span> = computed from
                        end-of-day data now; <span className="text-gray-400">Analyst read</span> = slow-moving structural context, current to mid-2026.
                    </p>
                </div>
                <Scorecard indicators={r.indicators} />
            </section>

            {/* Cycle clock + scenarios */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CycleClock cycles={r.cycles} />
                <ScenarioTimeline scenarios={r.scenarios} />
            </div>

            {/* Historical analogs */}
            <HistoricalTable analogs={r.analogs} closest={r.closestAnalog} />

            {/* Both sides — always */}
            <ReasonsColumns no={r.reasonsNoCrash} under={r.reasonsUnderestimated} />
        </>
    );
}

function ReportSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            Running the cycle-risk model — pulling the curve, credit, breadth and froth signals…
        </div>
    );
}

export default function CrashDetectorPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                        <Siren className="text-red-400" /> Crash Detector
                    </h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        An investment-committee read on where we are in the cycle — and the odds of a
                        correction, recession or crash. A single <strong className="text-gray-200">Crash
                        Detector Score</strong> (0–100) fuses live market signals — the yield curve,
                        credit spreads, breadth, volatility, concentration and speculative froth — with
                        the long-cycle clock and structural macro context. It does <em>not</em> assume a
                        crash: it weighs both sides and reports probabilities, not predictions.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <Suspense fallback={<ReportSkeleton />}>
                <Report />
            </Suspense>

            {/* Methodology */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <FileText size={16} className="text-teal-400" /> How the score works
                </h2>
                <div className="grid grid-cols-1 gap-4 text-xs leading-relaxed text-gray-400 md:grid-cols-2">
                    <div>
                        <p className="mb-1 font-semibold text-gray-300">Live market signals</p>
                        <p>
                            Computed every time you open the page from end-of-day data (cached up to 6h):
                            the 10y–3m curve, high-yield vs investment-grade credit, sector breadth, the
                            VIX, cap- vs equal-weight concentration, trend, drawdown and a speculative-froth
                            basket. Each is classified on fixed thresholds.
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 font-semibold text-gray-300">Structural & cycle overlay</p>
                        <p>
                            The slow-moving pieces a price feed can&apos;t see — the long-term debt cycle,
                            government and corporate leverage, housing, private-market activity — plus the
                            dated cycle clock (Juglar, Benner, Kitchin, Kuznets, 18-year real estate,
                            Dalio). Clearly labelled as analyst judgment, current to mid-2026.
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-gray-400">
                    <span className="font-semibold text-gray-300">The composite</span> weights each
                    indicator by its historical predictive power (the curve, credit, valuations and
                    concentration carry the most), maps the classifications to a 0–100 risk contribution
                    and blends them. Probabilities are a documented function of that score.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                    Heuristic and informational only — not investment advice. Late-cycle conditions can
                    persist for quarters or years, and a high score is a call for a wider margin of
                    safety, not a prediction that a crash is imminent. Where a number is an analyst read
                    rather than a live measurement, it is labelled as such.
                </p>
                <div className="mt-4 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Framework & data sources</p>
                    <ul className="flex flex-col gap-1.5">
                        {CRASH_SOURCES.map((s) => (
                            <li key={s.url}>
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline">
                                    {s.label}
                                    <ExternalLink size={11} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}

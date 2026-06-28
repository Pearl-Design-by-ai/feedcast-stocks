import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, Radar, TriangleAlert, ExternalLink, Telescope, Eye } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import RelatedLinks from '@/components/common/RelatedLinks';
import TradingViewWidget from '@/components/TradingViewWidget';
import { FrothGauge, ScoreBar, AssetTable } from '@/components/bubble/BubbleUi';
import { TopPopGrid } from '@/components/bubble/TopPopGrid';
import { runBubbleScan } from '@/lib/bubble-scan';
import { bubbleBand } from '@/lib/bubble';
import { ADVANCED_CHART_WIDGET_CONFIG } from '@/lib/constants';
import { formatSymbolForTradingView } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Bubble Detector',
    description:
        'Where could the next bubble be? A live bubble/pop-risk score across AI, quantum, precious metals, crypto and more — computed from real market data with AI research context.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

async function Scan() {
    const scan = await runBubbleScan();
    if (!scan) {
        return (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-sm text-gray-500">
                The bubble scan is temporarily unavailable. Please try again shortly.
            </div>
        );
    }

    return (
        <>
            <FrothGauge
                value={scan.frothIndex}
                asOf={scan.asOf}
                dataDate={scan.dataDate}
                scored={scan.scored}
                universe={scan.universe}
                phaseCounts={scan.phaseCounts}
            />

            {/* Highest pop risk right now */}
            {scan.topPop.length > 0 && (
                <section className="rounded-xl border border-red-400/20 bg-red-400/[0.03] p-4 md:p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-100">
                        <TriangleAlert size={16} className="text-red-400" />
                        Highest pop risk right now
                    </h2>
                    <p className="mb-4 text-xs text-gray-500">
                        Inflated names showing active deflation signals (below the 50-day average,
                        negative 1-month, or already falling from their highs).
                    </p>
                    <TopPopGrid assets={scan.topPop} />
                </section>
            )}

            {/* Theme sections */}
            <div className="flex flex-col gap-4">
                {scan.themes.map(({ theme, assets, avgBubble, avgPop }) => {
                    const band = bubbleBand(avgBubble);
                    return (
                        <section key={theme.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0 md:max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', theme.chip)}>
                                            {theme.label}
                                        </span>
                                        <span className={cn('text-xs font-semibold', band.tone === 'neg' ? 'text-red-400' : band.tone === 'warn' ? 'text-amber-400' : 'text-emerald-400')}>
                                            {band.label}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-gray-200">{theme.tagline}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-gray-400">{theme.why}</p>
                                </div>
                                <div className="flex shrink-0 gap-4 md:w-56 md:flex-col md:gap-2">
                                    <div className="flex-1">
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg bubble</p>
                                        <ScoreBar value={avgBubble} barClass={theme.bar} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg pop risk</p>
                                        <ScoreBar value={avgPop} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <AssetTable assets={assets} />
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* Next bubble candidates — emerging themes that could inflate from here */}
            <section className="rounded-xl border border-teal-400/20 bg-teal-400/[0.03] p-4 md:p-5">
                <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Telescope size={16} className="text-teal-400" />
                    Next bubble candidates
                </h2>
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                    Not manias yet — emerging themes with the <em>shape</em> of an early bubble: a real,
                    exciting story pulling in fast money. For each we track the tradeable instruments
                    and flag the signal that would tip it from “story” into “bubble.” Live scores below
                    show how inflated each one already is.
                </p>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {scan.candidates.map(({ candidate, assets, avgBubble, avgPop }) => (
                        <div key={candidate.id} className="flex flex-col rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                            <div className="flex items-center gap-2">
                                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', candidate.chip)}>
                                    {candidate.label}
                                </span>
                                <span className={cn('text-xs font-semibold', bubbleBand(avgBubble).tone === 'neg' ? 'text-red-400' : bubbleBand(avgBubble).tone === 'warn' ? 'text-amber-400' : 'text-emerald-400')}>
                                    {bubbleBand(avgBubble).label}
                                </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-200">{candidate.tagline}</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{candidate.thesis}</p>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg bubble</p>
                                    <ScoreBar value={avgBubble} barClass={candidate.bar} />
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg pop risk</p>
                                    <ScoreBar value={avgPop} />
                                </div>
                            </div>

                            <div className="mt-3 flex items-start gap-1.5 rounded-md border border-gray-800 bg-gray-950/40 p-2.5">
                                <Eye size={13} className="mt-0.5 shrink-0 text-teal-400" />
                                <p className="text-[11px] leading-relaxed text-gray-400">
                                    <span className="font-semibold text-gray-300">Watch for:</span> {candidate.watch}
                                </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {candidate.symbols.map((sym) => {
                                    const scored = assets.find((a) => a.symbol === sym);
                                    return (
                                        <Link
                                            key={sym}
                                            href={`/stocks/${sym}`}
                                            className="rounded-md border border-gray-800 bg-gray-900/60 px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:border-teal-400/40 hover:text-teal-300"
                                        >
                                            {sym}
                                            {scored && (
                                                <span className={cn('ml-1.5 tabular-nums', scored.bubbleScore >= 55 ? 'text-amber-400' : 'text-gray-500')}>
                                                    {scored.bubbleScore}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                    Each chip links to the stock page; the number is its live bubble score (0–100).
                    Candidate themes are editorial, mid-2026 — informational, not advice.
                </p>
            </section>

            {/* Charts for the two highest-pop-risk names */}
            {scan.topPop.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {scan.topPop.slice(0, 2).map((a) => (
                        <section key={a.symbol} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                            <h2 className="mb-3 text-base font-semibold text-gray-100">
                                {a.symbol} — chart{' '}
                                <span className="text-xs font-normal text-gray-500">
                                    pop risk {a.popRisk}/100 · bubble {a.bubbleScore}/100
                                </span>
                            </h2>
                            <TradingViewWidget
                                scriptUrl={`${SCRIPT}advanced-chart.js`}
                                config={ADVANCED_CHART_WIDGET_CONFIG(formatSymbolForTradingView(a.symbol), ['STD;SMA@tv-basicstudies'])}
                                height={400}
                                allowExpand
                            />
                        </section>
                    ))}
                </div>
            )}
        </>
    );
}

function ScanSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            Scanning the universe for froth — pulling 2 years of data per asset…
        </div>
    );
}

/** Curated "lessons from past bubbles" — served by the engine alongside the scan. */
async function HistoricalLessons() {
    const scan = await runBubbleScan();
    if (!scan?.historical?.length) return null;
    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="text-base font-semibold text-gray-100">Lessons from past bubbles</h2>
            <p className="mb-4 mt-0.5 text-xs text-gray-500">
                Every mania below shared the shape this page measures — parabolic price far above
                trend, euphoric momentum, then the roll-over. Peak-to-trough declines:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {scan.historical.map((h) => (
                    <div key={h.name} className="flex flex-col rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-100">{h.name}</span>
                            <span className="text-lg font-bold tabular-nums text-red-400">{h.drawdown}</span>
                        </div>
                        <span className="text-[11px] text-gray-500">{h.era}</span>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full rounded-full bg-red-400/70" style={{ width: `${h.drawdownPct}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-gray-400">{h.window}</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-400">
                            <span className="text-gray-300">The tell:</span> {h.tell}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{h.lesson}</p>
                    </div>
                ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                Pattern recognition, not prophecy — every bubble is different, and overbought can
                stay overbought far longer than seems possible.
            </p>
        </section>
    );
}

/** Research source links — served by the engine alongside the scan. */
async function BubbleSources() {
    const scan = await runBubbleScan();
    if (!scan?.sources?.length) return null;
    return (
        <div className="mt-4 border-t border-gray-800 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Research sources</p>
            <ul className="flex flex-col gap-1.5">
                {scan.sources.map((s) => (
                    <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline">
                            {s.label}
                            <ExternalLink size={11} />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function BubbleDetectorPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                        <Radar className="text-teal-400" /> Bubble Detector
                    </h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">Where could the next bubble be — and what is already cracking?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Where could the next bubble be — and what’s already cracking? Each asset gets
                        a live <strong className="text-gray-200">bubble score</strong> (how inflated)
                        and a <strong className="text-gray-200">pop-risk score</strong> (how fragile),
                        computed from two years of real price data. The “why” for each theme is AI
                        research, current to mid-2026.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <ScoreMethodology
                methodology="Each asset gets a bubble score (how far price sits above its 200-day average, the 1-year run-up, RSI(14) and distance to its 52-week high) and a pop-risk score (the bubble score scaled by active deflation signals — below the 50-day average, a negative month, already down 8%+ from the high, or a volatility spike). Theme “why” is AI research. Full breakdown in “How the scores work” below."
                cadence="Recomputed each visit from end-of-day closes (cached up to ~6h); inputs are daily closes, so scores move about once per trading day after the US close. Theme/candidate write-ups are editorial, current to mid-2026."
                thresholds="Bubble & pop-risk are 0–100. Roughly: <40 calm · 40–54 warm · 55–69 stretched · 70+ frothy. “Highest pop risk” = inflated names already showing deflation signals. * = under ~1 year of history."
            />

            <Suspense fallback={<ScanSkeleton />}>
                <Scan />
            </Suspense>

            {/* Lessons from past bubbles */}
            <Suspense fallback={null}>
                <HistoricalLessons />
            </Suspense>

            {/* Methodology + sources */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-3 text-base font-semibold text-gray-100">How the scores work</h2>
                <div className="grid grid-cols-1 gap-4 text-xs leading-relaxed text-gray-400 md:grid-cols-2">
                    <div>
                        <p className="mb-1 font-semibold text-gray-300">Bubble score (0–100)</p>
                        <p>
                            Blends how far price sits above its 200-day average, the 1-year run-up,
                            RSI(14) and how close it is to its 52-week high. High = stretched far
                            beyond trend on strong momentum — the shape of an inflating bubble.
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 font-semibold text-gray-300">Pop risk (0–100)</p>
                        <p>
                            Scales the bubble score by active deflation signals: trading below the
                            50-day average, a negative last month, already falling 8%+ from the high,
                            or a volatility spike. A calm asset stays low; an inflated one that’s
                            started to roll over reads high.
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-gray-400">
                    <span className="font-semibold text-gray-300">How often it updates:</span> scores
                    recompute every time you open the page, from end-of-day closing prices cached up
                    to 6 hours. Because the inputs are daily closes, the numbers move meaningfully
                    about <span className="text-gray-200">once per trading day</span> (after the US
                    close) — intraday wiggles don’t change them.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                    Heuristic and informational only — not investment advice. Bubbles can inflate far
                    longer than scores suggest, and a high reading is not a forecast of an imminent
                    crash. <span className="text-gray-600">* = under ~1 year of price history.</span>
                </p>
                <Suspense fallback={null}>
                    <BubbleSources />
                </Suspense>
            </section>

            <RelatedLinks
                items={[
                    { href: '/watchlist', label: 'Add to a watchlist', desc: 'Track the frothy or cracking names you want to keep an eye on' },
                    { href: '/alerts', label: 'Set a price alert', desc: 'Get emailed if a stretched name breaks a level' },
                    { href: '/crash-detector', label: 'Crash Detector', desc: 'Zoom out from single-asset froth to whole-cycle risk' },
                    { href: '/valuation', label: 'Valuation', desc: 'Cross-check froth against where price is rich or cheap' },
                ]}
            />
        </div>
    );
}

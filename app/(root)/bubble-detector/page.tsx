import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, Radar, TriangleAlert, ExternalLink } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import { FrothGauge, ScoreBar, PhaseChip, AssetTable } from '@/components/bubble/BubbleUi';
import { runBubbleScan } from '@/lib/bubble-scan';
import { bubbleBand, BUBBLE_SOURCES } from '@/lib/bubble';
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

    return (
        <>
            <FrothGauge value={scan.frothIndex} asOf={scan.asOf} />

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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {scan.topPop.map((a) => (
                            <Link
                                key={a.symbol}
                                href={`/stocks/${a.symbol}`}
                                className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 transition-colors hover:border-red-400/40"
                            >
                                <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-gray-100">{a.symbol}</span>
                                    <span className="text-sm font-bold tabular-nums text-red-400">{a.popRisk}</span>
                                </div>
                                <div className="mt-2"><PhaseChip phase={a.phase} /></div>
                            </Link>
                        ))}
                    </div>
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

export default function BubbleDetectorPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                        <Radar className="text-teal-400" /> Bubble Detector
                    </h1>
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

            <Suspense fallback={<ScanSkeleton />}>
                <Scan />
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
                <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
                    Heuristic and informational only — not investment advice. Bubbles can inflate far
                    longer than scores suggest, and a high reading is not a forecast of an imminent
                    crash. <span className="text-gray-600">* = under ~1 year of price history.</span>
                </p>
                <div className="mt-4 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Research sources</p>
                    <ul className="flex flex-col gap-1.5">
                        {BUBBLE_SOURCES.map((s) => (
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

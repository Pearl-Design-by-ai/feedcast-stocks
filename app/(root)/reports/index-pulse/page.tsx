import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MarketHeatmap from '@/components/markets/MarketHeatmap';
import {
    ReportHeader,
    Section,
    StatCard,
    SignalBadge,
    BottomLine,
    ChangeCell,
    toneForChange,
    fmtPct,
    fmtPrice,
} from '@/components/reports/ReportUi';
import { getReport, INDEX_SYMBOLS, SECTOR_SYMBOLS, type ReportTone } from '@/lib/reports';
import { getReportQuotes, reportTimestamp } from '@/lib/reports-data';

export const metadata: Metadata = {
    title: 'Index Pulse',
    description:
        'A live technical pulse of the US tape — index ETFs, equal-weight vs cap-weight breadth, and sector leadership fused into one verdict.',
};

const report = getReport('index-pulse')!;

const INDEX_LABELS: Record<string, string> = {
    SPY: 'S&P 500',
    QQQ: 'Nasdaq 100',
    IWM: 'Russell 2000',
    DIA: 'Dow Jones',
    RSP: 'S&P 500 equal-weight',
};

async function PulseData() {
    const quotes = await getReportQuotes([
        ...INDEX_SYMBOLS,
        ...SECTOR_SYMBOLS.map((s) => s.symbol),
    ]);

    if (quotes.size === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Live quotes are unavailable right now — the heatmap below still works.
            </div>
        );
    }

    const dp = (sym: string) => quotes.get(sym)?.changePercent ?? 0;

    // Breadth: how many of the 11 sectors are green, and is the average stock
    // (RSP) keeping up with the cap-weighted index (SPY)?
    const sectors = SECTOR_SYMBOLS.map((s) => ({ ...s, changePercent: dp(s.symbol) })).sort(
        (a, b) => b.changePercent - a.changePercent
    );
    const advancing = sectors.filter((s) => s.changePercent > 0).length;
    const rspSpread = dp('RSP') - dp('SPY');
    const spy = dp('SPY');

    // Verdict: direction from SPY, quality from participation.
    const broad = advancing >= 8;
    const narrow = advancing <= 4;
    let verdictTone: ReportTone;
    let verdict: string;
    if (spy >= 0.15 && broad) {
        verdictTone = 'pos';
        verdict = `Healthy up-tape: the S&P is ${fmtPct(spy)} with ${advancing} of 11 sectors participating${rspSpread > 0 ? ' and the average stock outperforming the index' : ''}. Broad rallies are the durable kind.`;
    } else if (spy >= 0.15 && narrow) {
        verdictTone = 'warn';
        verdict = `Narrow up-tape: the index is ${fmtPct(spy)} but only ${advancing} of 11 sectors are green — a few mega-caps are doing the lifting. These rallies are fragile; watch whether breadth catches up.`;
    } else if (spy <= -0.15 && narrow) {
        verdictTone = 'neg';
        verdict = `Broad down-tape: the S&P is ${fmtPct(spy)} with only ${advancing} of 11 sectors holding green. Selling is widespread — respect it rather than fighting it.`;
    } else if (spy <= -0.15) {
        verdictTone = 'warn';
        verdict = `Soft but selective tape: the index is ${fmtPct(spy)} yet ${advancing} of 11 sectors are still green — this looks more like rotation than liquidation.`;
    } else {
        verdictTone = 'neutral';
        verdict = `Flat tape: the S&P is ${fmtPct(spy)} with ${advancing} of 11 sectors green and the equal-weight spread at ${fmtPct(rspSpread)}. No verdict to force today — let the next session pick a direction.`;
    }

    const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.changePercent)), 0.01);

    return (
        <>
            <Section title="Major indices" subtitle="Today’s move across the core US index ETFs.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {INDEX_SYMBOLS.map((sym) => {
                        const quote = quotes.get(sym);
                        return (
                            <StatCard
                                key={sym}
                                label={INDEX_LABELS[sym] ?? sym}
                                value={quote ? fmtPct(quote.changePercent) : '—'}
                                sub={quote ? `${sym} · ${fmtPrice(quote.price)}` : sym}
                                tone={quote ? toneForChange(quote.changePercent) : 'neutral'}
                            />
                        );
                    })}
                </div>
            </Section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Section
                    title="Breadth check"
                    subtitle="Is the average stock confirming the index?"
                    className="lg:col-span-1"
                >
                    <div className="flex flex-col gap-3">
                        <StatCard
                            label="Sectors advancing"
                            value={`${advancing} / 11`}
                            sub={broad ? 'Broad participation' : narrow ? 'Narrow tape' : 'Mixed participation'}
                            tone={broad ? 'pos' : narrow ? 'neg' : 'warn'}
                        />
                        <StatCard
                            label="Equal-weight vs SPY"
                            value={fmtPct(rspSpread)}
                            sub={
                                rspSpread > 0
                                    ? 'RSP leading — the average stock is doing better than the index'
                                    : 'SPY leading — mega-caps are carrying the tape'
                            }
                            tone={toneForChange(rspSpread)}
                        />
                    </div>
                </Section>

                <Section
                    title="Sector leadership"
                    subtitle="All 11 SPDR sectors ranked by today’s move."
                    className="lg:col-span-2"
                >
                    <div className="flex flex-col gap-1.5">
                        {sectors.map((s, i) => (
                            <div key={s.symbol} className="flex items-center gap-3 text-sm">
                                <span className="w-5 text-right text-xs tabular-nums text-gray-600">{i + 1}</span>
                                <span className="w-32 truncate text-gray-300 sm:w-40">{s.label}</span>
                                <span className="w-12 text-xs text-gray-500">{s.symbol}</span>
                                <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800">
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-full ${s.changePercent >= 0 ? 'bg-emerald-400/70' : 'bg-red-400/70'}`}
                                        style={{ width: `${(Math.abs(s.changePercent) / maxAbs) * 100}%` }}
                                    />
                                </div>
                                <span className="w-16 text-right">
                                    <ChangeCell changePercent={s.changePercent} />
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <SignalBadge tone="pos">Leader: {sectors[0].label} {fmtPct(sectors[0].changePercent)}</SignalBadge>
                        <SignalBadge tone="neg">
                            Laggard: {sectors[sectors.length - 1].label} {fmtPct(sectors[sectors.length - 1].changePercent)}
                        </SignalBadge>
                    </div>
                </Section>
            </div>

            <BottomLine tone={verdictTone}>{verdict}</BottomLine>
        </>
    );
}

export default function IndexPulsePage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ReportHeader report={report} timestamp={reportTimestamp()} />

            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                        Taking the market’s pulse…
                    </div>
                }
            >
                <PulseData />
            </Suspense>

            <Section
                title="Market heatmap"
                subtitle="The same tape, stock by stock — size is market cap, color is the period’s move."
            >
                <MarketHeatmap />
            </Section>
        </div>
    );
}

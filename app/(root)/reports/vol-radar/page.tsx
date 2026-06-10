import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import TradingViewWidget from '@/components/TradingViewWidget';
import {
    ReportHeader,
    Section,
    StatCard,
    SignalBadge,
    BottomLine,
    toneForChange,
    fmtPct,
} from '@/components/reports/ReportUi';
import { getReport, VOL_SYMBOLS, type ReportTone } from '@/lib/reports';
import { getReportQuotes, reportTimestamp, type ReportQuote } from '@/lib/reports-data';
import { ADVANCED_CHART_WIDGET_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Vol Radar',
    description:
        'A live read on the volatility regime — how equities and vol proxies move together, cross-checked against credit, bonds and gold.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const report = getReport('vol-radar')!;

// Today's risk regime from the joint SPY / VIXY move. VIXY tracks short-term
// VIX futures, so "VIXY up hard" ≈ vol bid. Quadrant logic, with a dead zone
// so a flat day doesn't get a dramatic label.
function readRegime(spy: number, vol: number): { name: string; tone: ReportTone; note: string } {
    const spyUp = spy >= 0.15;
    const spyDown = spy <= -0.15;
    const volUp = vol >= 1;
    const volDown = vol <= -1;

    if (spyUp && volDown)
        return {
            name: 'Risk-on / vol crush',
            tone: 'pos',
            note: 'Stocks up while volatility deflates — the cleanest risk-on combination. Hedges are being unwound, not added.',
        };
    if (spyUp && volUp)
        return {
            name: 'Hedged rally',
            tone: 'warn',
            note: 'Stocks are up but volatility is bid at the same time — someone is paying up for protection into this strength. Rallies with rising vol deserve scepticism.',
        };
    if (spyDown && volUp)
        return {
            name: 'Risk-off',
            tone: 'neg',
            note: 'Stocks down with volatility spiking — classic de-risking. Position sizes matter more than opinions in this regime.',
        };
    if (spyDown && volDown)
        return {
            name: 'Orderly pullback',
            tone: 'warn',
            note: 'Stocks are lower but volatility is not bid — a controlled, low-panic dip rather than a rush for the exits.',
        };
    return {
        name: 'Quiet tape',
        tone: 'neutral',
        note: 'Neither equities nor volatility are doing much today — a coiling session. Quiet regimes end; direction usually comes with the next catalyst.',
    };
}

function crossChecks(q: Map<string, ReportQuote>) {
    const dp = (sym: string) => q.get(sym)?.changePercent ?? 0;
    return [
        {
            label: 'Credit (HYG)',
            value: fmtPct(dp(VOL_SYMBOLS.credit)),
            tone: toneForChange(dp(VOL_SYMBOLS.credit)),
            note:
                dp(VOL_SYMBOLS.credit) <= -0.3
                    ? 'High-yield confirms the stress — credit is selling too.'
                    : 'Credit is calm — any equity vol today is not (yet) a credit event.',
        },
        {
            label: 'Duration (TLT)',
            value: fmtPct(dp(VOL_SYMBOLS.bonds)),
            tone: toneForChange(dp(VOL_SYMBOLS.bonds)),
            note:
                dp(VOL_SYMBOLS.bonds) >= 0.4
                    ? 'Long bonds are catching a safety bid — flight to quality.'
                    : dp(VOL_SYMBOLS.bonds) <= -0.4
                      ? 'Bonds are selling alongside — rates pressure, not a haven day.'
                      : 'Bonds are quiet — no flight-to-quality signal.',
        },
        {
            label: 'Gold (GLD)',
            value: fmtPct(dp(VOL_SYMBOLS.gold)),
            tone: toneForChange(dp(VOL_SYMBOLS.gold)),
            note:
                dp(VOL_SYMBOLS.gold) >= 0.5
                    ? 'Gold is bid — the fear trade has a second confirmation.'
                    : 'Gold is not confirming a fear trade.',
        },
        {
            label: 'Growth proxy (QQQ)',
            value: fmtPct(dp(VOL_SYMBOLS.ndx)),
            tone: toneForChange(dp(VOL_SYMBOLS.ndx)),
            note:
                dp(VOL_SYMBOLS.ndx) - dp(VOL_SYMBOLS.spx) < -0.3
                    ? 'Mega-cap growth is lagging the broad tape — risk appetite is fading at the top.'
                    : 'Growth is keeping pace with the broad market.',
        },
    ];
}

const GLOSSARY: Array<{ term: string; def: string }> = [
    { term: 'VIX', def: '30-day implied volatility of the S&P 500 — the market’s priced-in expectation of movement, not a fear meter per se.' },
    { term: 'Term structure', def: 'VIX values across expiries. Short-dated above long-dated (backwardation) = acute stress; the normal upward slope (contango) = calm.' },
    { term: 'Contango', def: 'Near-term vol cheaper than longer-term — the market expects calm now, uncertainty later. The default state.' },
    { term: 'Backwardation', def: 'Near-term vol more expensive than longer-term — stress is here and now. Historically clusters around corrections.' },
    { term: 'Implied vs realized vol', def: 'Implied is what options price in; realized is what actually happened. A wide gap means options are expensive (or cheap) relative to the tape.' },
    { term: 'Skew', def: 'How much more expensive downside puts are than upside calls — a read on crash insurance demand.' },
    { term: 'Dealer gamma', def: 'When dealers are short gamma their hedging amplifies moves; when long gamma it dampens them. One reason quiet tapes stay quiet and ugly tapes get uglier.' },
    { term: 'Vol crush', def: 'A fast collapse in implied vol, typically after an event (CPI, FOMC, earnings) passes without disaster.' },
];

async function VolData() {
    const quotes = await getReportQuotes(Object.values(VOL_SYMBOLS));

    if (quotes.size === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Live quotes are unavailable right now — the VIX chart and glossary below still work.
            </div>
        );
    }

    const dp = (sym: string) => quotes.get(sym)?.changePercent ?? 0;
    const spy = dp(VOL_SYMBOLS.spx);
    const vol = dp(VOL_SYMBOLS.vol);
    const regime = readRegime(spy, vol);
    const checks = crossChecks(quotes);
    const confirming = checks.filter((c) => c.tone === 'neg').length;

    return (
        <>
            <Section
                title="Today’s risk regime"
                subtitle="Read jointly from the S&P 500 (SPY) and the short-term VIX futures proxy (VIXY)."
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="flex flex-col justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:col-span-1">
                        <SignalBadge tone={regime.tone}>{regime.name}</SignalBadge>
                        <p className="text-xs leading-relaxed text-gray-400">{regime.note}</p>
                    </div>
                    <StatCard
                        label="S&P 500 (SPY)"
                        value={fmtPct(spy)}
                        sub="Direction of the tape"
                        tone={toneForChange(spy)}
                    />
                    <StatCard
                        label="Vol proxy (VIXY)"
                        value={fmtPct(vol)}
                        sub="VIXY up hard = volatility bid"
                        tone={toneForChange(vol, true)}
                    />
                </div>
            </Section>

            <Section
                title="Cross-checks"
                subtitle="A vol signal you can’t confirm anywhere else is usually noise. Four second opinions:"
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {checks.map((c) => (
                        <div
                            key={c.label}
                            className="flex flex-col gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {c.label}
                                </span>
                                <span className="text-sm font-semibold tabular-nums text-gray-200">{c.value}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-400">{c.note}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <BottomLine tone={regime.tone}>
                {regime.name === 'Quiet tape'
                    ? 'Volatility has nothing to say today — which is itself information. Use quiet sessions to plan, not to chase.'
                    : `Regime: ${regime.name.toLowerCase()}, with ${confirming} of 4 cross-checks leaning risk-off. ${
                          regime.tone === 'neg'
                              ? 'When equity weakness and a vol bid agree, reduce first and ask questions later.'
                              : regime.tone === 'warn'
                                ? 'The signals disagree — size positions as if the cautious read is the right one.'
                                : 'Vol is being unwound, not accumulated; the path of least resistance is higher until that changes.'
                      }`}
            </BottomLine>
        </>
    );
}

export default function VolRadarPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ReportHeader report={report} timestamp={reportTimestamp()} />

            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                        Scanning the volatility surface…
                    </div>
                }
            >
                <VolData />
            </Suspense>

            <Section
                title="Volatility chart — VIXY (short-term VIX futures ETF)"
                subtitle="The VIX index itself is gated in free embeds, so we chart its tradable proxy — the level matters less than the direction and the speed of change."
            >
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}advanced-chart.js`}
                    config={ADVANCED_CHART_WIDGET_CONFIG('AMEX:VIXY')}
                    height={440}
                    allowExpand
                />
                <a
                    href="https://www.tradingview.com/chart/?symbol=TVC%3AVIX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:underline"
                >
                    Open the real VIX index on TradingView
                    <ExternalLink size={13} />
                </a>
            </Section>

            <Section
                title="Vol glossary"
                subtitle="The eight terms that cover most volatility commentary — in plain language."
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {GLOSSARY.map(({ term, def }) => (
                        <div key={term} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                            <span className="text-sm font-semibold text-violet-400">{term}</span>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{def}</p>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}

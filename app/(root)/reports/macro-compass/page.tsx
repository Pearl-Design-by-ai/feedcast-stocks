import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
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
import { getReport, MACRO_SYMBOLS, type ReportTone } from '@/lib/reports';
import { getReportQuotes, reportTimestamp, type ReportQuote } from '@/lib/reports-data';
import {
    ADVANCED_CHART_WIDGET_CONFIG,
    ECONOMIC_CALENDAR_WIDGET_CONFIG,
} from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Macro Compass',
    description:
        'A live daily macro brief — rates, dollar, credit and inflation hedges read through liquid proxy ETFs, with a traffic-light alarm panel.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const report = getReport('macro-compass')!;

// One alarm axis: label, the reading, and a tone with a plain-language note.
interface Alarm {
    label: string;
    value: string;
    tone: ReportTone;
    note: string;
}

function buildAlarms(q: Map<string, ReportQuote>): Alarm[] {
    const dp = (sym: string) => q.get(sym)?.changePercent ?? 0;
    const alarms: Alarm[] = [];

    // Credit: high-yield selling off (especially vs investment grade) is the
    // classic early stress signal.
    const hy = dp(MACRO_SYMBOLS.highYield);
    const ig = dp(MACRO_SYMBOLS.investGrade);
    const creditSpread = hy - ig;
    alarms.push({
        label: 'Credit stress',
        value: `HYG ${fmtPct(hy)} · vs LQD ${fmtPct(creditSpread)}`,
        tone: hy <= -0.5 || creditSpread <= -0.4 ? 'neg' : hy < -0.15 ? 'warn' : 'pos',
        note:
            hy <= -0.5 || creditSpread <= -0.4
                ? 'High-yield is underperforming — credit is flashing risk-off.'
                : hy < -0.15
                  ? 'High-yield is soft today; not stressed, worth watching.'
                  : 'High-yield credit is calm — no stress signal from the bond market.',
    });

    // Duration: a sharp move in 20y+ Treasuries either way is a rates shock.
    const tlt = dp(MACRO_SYMBOLS.longRates);
    alarms.push({
        label: 'Rates shock',
        value: `TLT ${fmtPct(tlt)}`,
        tone: Math.abs(tlt) >= 1 ? 'neg' : Math.abs(tlt) >= 0.5 ? 'warn' : 'pos',
        note:
            Math.abs(tlt) >= 1
                ? `Long-end Treasuries are moving hard ${tlt > 0 ? '(yields falling fast)' : '(yields rising fast)'} — duration shock.`
                : Math.abs(tlt) >= 0.5
                  ? 'The long end is active today; rates are repricing moderately.'
                  : 'Long-term rates are quiet — no duration shock today.',
    });

    // Dollar: big moves either way ripple through everything priced in USD.
    const usd = dp(MACRO_SYMBOLS.dollar);
    alarms.push({
        label: 'Dollar move',
        value: `UUP ${fmtPct(usd)}`,
        tone: Math.abs(usd) >= 0.7 ? 'neg' : Math.abs(usd) >= 0.35 ? 'warn' : 'pos',
        note:
            Math.abs(usd) >= 0.7
                ? `The dollar is ${usd > 0 ? 'surging' : 'sliding'} — expect knock-on moves in commodities and multinationals.`
                : Math.abs(usd) >= 0.35
                  ? 'The dollar is on the move, but within a normal daily range.'
                  : 'The dollar is steady — no currency shock in today’s session.',
    });

    // Inflation pulse: gold + oil + TIPS rallying together = inflation bid.
    const infl =
        (dp(MACRO_SYMBOLS.gold) + dp(MACRO_SYMBOLS.oil) + dp(MACRO_SYMBOLS.tips)) / 3;
    alarms.push({
        label: 'Inflation pulse',
        value: `Gold+Oil+TIPS avg ${fmtPct(infl)}`,
        tone: infl >= 0.8 ? 'warn' : infl <= -0.8 ? 'warn' : 'pos',
        note:
            infl >= 0.8
                ? 'Inflation hedges are catching a bid together — the market is pricing hotter inflation.'
                : infl <= -0.8
                  ? 'Inflation hedges are selling off together — disinflation (or growth fear) trade.'
                  : 'Inflation hedges are mixed/quiet — no clear inflation impulse today.',
    });

    return alarms;
}

async function MacroData() {
    const quotes = await getReportQuotes(Object.values(MACRO_SYMBOLS));
    const get = (sym: string) => quotes.get(sym);

    if (quotes.size === 0) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Live quotes are unavailable right now — the charts and calendar below still work.
            </div>
        );
    }

    const proxies: Array<{ sym: string; label: string; sub: string; flipped?: boolean }> = [
        { sym: MACRO_SYMBOLS.shortRates, label: '1–3y Treasuries', sub: 'SHY — front end' },
        { sym: MACRO_SYMBOLS.midRates, label: '7–10y Treasuries', sub: 'IEF — belly' },
        { sym: MACRO_SYMBOLS.longRates, label: '20y+ Treasuries', sub: 'TLT — long end' },
        { sym: MACRO_SYMBOLS.dollar, label: 'US Dollar', sub: 'UUP — dollar index proxy' },
        { sym: MACRO_SYMBOLS.gold, label: 'Gold', sub: 'GLD' },
        { sym: MACRO_SYMBOLS.oil, label: 'Oil', sub: 'USO — WTI proxy' },
        { sym: MACRO_SYMBOLS.tips, label: 'TIPS', sub: 'TIP — inflation-linked' },
        { sym: MACRO_SYMBOLS.highYield, label: 'High-yield credit', sub: 'HYG' },
        { sym: MACRO_SYMBOLS.investGrade, label: 'Invest.-grade credit', sub: 'LQD' },
    ];

    const alarms = buildAlarms(quotes);
    const worst: ReportTone = alarms.some((a) => a.tone === 'neg')
        ? 'neg'
        : alarms.some((a) => a.tone === 'warn')
          ? 'warn'
          : 'pos';
    const flagged = alarms.filter((a) => a.tone !== 'pos').map((a) => a.label.toLowerCase());

    return (
        <>
            <Section
                title="Macro dashboard"
                subtitle="Today’s move in each macro proxy ETF. Remember: bond ETFs up = yields down."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {proxies.map(({ sym, label, sub }) => {
                        const quote = get(sym);
                        return (
                            <StatCard
                                key={sym}
                                label={label}
                                value={quote ? fmtPct(quote.changePercent) : '—'}
                                sub={sub}
                                tone={quote ? toneForChange(quote.changePercent) : 'neutral'}
                            />
                        );
                    })}
                </div>
            </Section>

            <Section
                title="Alarm panel"
                subtitle="Each macro axis scored green / amber / red from today’s quotes."
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {alarms.map((alarm) => (
                        <div
                            key={alarm.label}
                            className="flex flex-col gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {alarm.label}
                                </span>
                                <SignalBadge tone={alarm.tone}>
                                    {alarm.tone === 'pos' ? 'Calm' : alarm.tone === 'warn' ? 'Watch' : 'Alert'}
                                </SignalBadge>
                            </div>
                            <span className="text-sm font-semibold text-gray-200 tabular-nums">
                                {alarm.value}
                            </span>
                            <p className="text-xs leading-relaxed text-gray-400">{alarm.note}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <BottomLine tone={worst}>
                {worst === 'pos'
                    ? 'All four macro axes are calm today — credit, rates, the dollar and inflation hedges are trading inside normal ranges. Macro is not the story of this session.'
                    : `Today’s macro tape is not fully quiet: ${flagged.join(', ')} ${flagged.length > 1 ? 'are' : 'is'} flagged above. Read the panel notes — when macro moves, it usually outranks single-stock news.`}
            </BottomLine>
        </>
    );
}

export default function MacroCompassPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ReportHeader report={report} timestamp={reportTimestamp()} />

            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        Reading the macro tape…
                    </div>
                }
            >
                <MacroData />
            </Suspense>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="US 10-year yield" subtitle="The single most-watched macro number.">
                    <TradingViewWidget
                        scriptUrl={`${SCRIPT}advanced-chart.js`}
                        config={ADVANCED_CHART_WIDGET_CONFIG('TVC:US10Y')}
                        height={420}
                        allowExpand
                    />
                </Section>
                <Section
                    title="Yield curve (10y − 2y)"
                    subtitle="Below zero = inverted; re-steepening after inversion is the recession tell."
                >
                    <TradingViewWidget
                        scriptUrl={`${SCRIPT}advanced-chart.js`}
                        config={ADVANCED_CHART_WIDGET_CONFIG('FRED:T10Y2Y')}
                        height={420}
                        allowExpand
                    />
                </Section>
            </div>

            <Section
                title="What could move this next"
                subtitle="Medium/high-importance macro events across major economies."
            >
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}events.js`}
                    config={ECONOMIC_CALENDAR_WIDGET_CONFIG}
                    height={550}
                />
            </Section>
        </div>
    );
}

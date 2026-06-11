import type { Metadata } from 'next';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getAnalysisTool } from '@/lib/analysis';
import { getPickerWatchlist, symbolFromParams } from '@/lib/analysis-server';
import {
    ToolHeader,
    SymbolPicker,
    Section,
    SignalRow,
    StatCard,
    BottomLine,
    EmptyToolState,
    NoDataState,
    type Tone,
} from '@/components/analysis/AnalysisUi';
import { sma, momentum, highestClose, fmtUsd, fmtSignedPct } from '@/lib/technical';

export const metadata: Metadata = {
    title: 'Trend Check',
    description: 'Is this stock really trending? A verdict from SMAs, the 50/200 cross and momentum.',
};

const tool = getAnalysisTool('trend-check')!;

interface Signal {
    label: string;
    reading: string;
    tone: Tone;
    note: string;
}

function analyze(closes: number[]) {
    const last = closes[closes.length - 1];
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const m1 = momentum(closes, 21);
    const m3 = momentum(closes, 63);
    const m6 = momentum(closes, 126);
    const high52 = highestClose(closes, 252);
    const offHigh = high52 ? (last / high52 - 1) * 100 : null;

    const signals: Signal[] = [];

    if (sma200 != null) {
        const above = last > sma200;
        signals.push({
            label: 'Price vs 200-day average',
            reading: `${fmtUsd(last)} vs ${fmtUsd(sma200)}`,
            tone: above ? 'pos' : 'neg',
            note: above
                ? 'Trading above the long-term average — the big trend has the benefit of the doubt.'
                : 'Below the 200-day — long-term holders are underwater on average; rallies face supply.',
        });
    }
    if (sma50 != null) {
        const above = last > sma50;
        signals.push({
            label: 'Price vs 50-day average',
            reading: `${fmtUsd(last)} vs ${fmtUsd(sma50)}`,
            tone: above ? 'pos' : 'neg',
            note: above
                ? 'Above the 50-day — the intermediate trend is supportive.'
                : 'Below the 50-day — the intermediate trend has rolled over.',
        });
    }
    if (sma50 != null && sma200 != null) {
        const golden = sma50 > sma200;
        signals.push({
            label: '50/200 cross',
            reading: golden ? 'Golden cross in effect' : 'Death cross in effect',
            tone: golden ? 'pos' : 'neg',
            note: golden
                ? 'The 50-day rides above the 200-day — the classic structural-uptrend configuration.'
                : 'The 50-day sits below the 200-day — structurally still a downtrend configuration.',
        });
    }
    if (m3 != null && m1 != null) {
        const tone: Tone = m3 > 5 && m1 > 0 ? 'pos' : m3 < -5 && m1 < 0 ? 'neg' : 'warn';
        signals.push({
            label: 'Momentum (1m / 3m / 6m)',
            reading: `${fmtSignedPct(m1)} / ${fmtSignedPct(m3)} / ${m6 != null ? fmtSignedPct(m6) : '—'}`,
            tone,
            note:
                tone === 'pos'
                    ? 'Gains stack across horizons — momentum is doing the heavy lifting.'
                    : tone === 'neg'
                      ? 'Losses stack across horizons — momentum is working against longs.'
                      : 'Horizons disagree — the move lacks follow-through one way or the other.',
        });
    }
    if (offHigh != null) {
        const tone: Tone = offHigh > -5 ? 'pos' : offHigh > -15 ? 'warn' : 'neg';
        signals.push({
            label: 'Distance from 52-week high',
            reading: fmtSignedPct(offHigh),
            tone,
            note:
                tone === 'pos'
                    ? 'Pressing the highs — strong stocks make new highs; weak ones don’t get here.'
                    : tone === 'warn'
                      ? 'A normal pullback zone — fine in an uptrend, worth watching in a weak one.'
                      : 'Deep below the highs — this is repair territory, not trend territory.',
        });
    }

    const score = signals.reduce(
        (acc, s) => acc + (s.tone === 'pos' ? 1 : s.tone === 'neg' ? -1 : 0),
        0
    );
    const max = signals.length;

    let verdict: { tone: Tone; title: string; text: string };
    if (score >= max - 1 && max >= 4) {
        verdict = {
            tone: 'pos',
            title: 'Real uptrend',
            text: `the structure, the averages and momentum all point the same way (${score}/${max} signals bullish). This is what a genuine trend looks like — the usual risk is chasing extended entries, not the trend itself.`,
        };
    } else if (score >= 2) {
        verdict = {
            tone: 'pos',
            title: 'Uptrend with caveats',
            text: `most signals lean bullish (${score}/${max}), but not all confirm. Trend-following is playable; just respect the signals that disagree — they mark where you’re wrong.`,
        };
    } else if (score <= -2) {
        verdict = {
            tone: 'neg',
            title: 'Downtrend',
            text: `the weight of evidence is bearish (${Math.abs(score)}/${max} signals against). “It looks cheap” is not a trend signal — until the averages and momentum turn, rallies are suspect.`,
        };
    } else {
        verdict = {
            tone: 'warn',
            title: 'Choppy / no trend',
            text: `signals are split (net score ${score >= 0 ? '+' : ''}${score}). This is a ranging tape — trend tools underperform here, and patience usually beats positioning.`,
        };
    }

    return { signals, verdict, last, sma50, sma200 };
}

export default async function TrendCheckPage({
    searchParams,
}: {
    searchParams: Promise<{ symbol?: string | string[] }>;
}) {
    const symbol = symbolFromParams(await searchParams);
    const watchlist = await getPickerWatchlist();

    let body: React.ReactNode = <EmptyToolState name="Trend Check" />;

    if (symbol) {
        const series = await fetchDailyCloses(symbol);
        const closes = series.map((c) => c.close);
        if (closes.length < 60) {
            body = <NoDataState symbol={symbol} />;
        } else {
            const { signals, verdict, last } = analyze(closes);
            body = (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard label="Symbol" value={symbol} sub={`${closes.length} trading days of history`} />
                        <StatCard label="Last close" value={fmtUsd(last)} sub={series[series.length - 1]?.date} />
                        <StatCard
                            label="Trend verdict"
                            value={verdict.title}
                            tone={verdict.tone}
                            sub="Scored from the signals below"
                        />
                    </div>

                    <Section
                        title="The evidence"
                        subtitle="Every input to the verdict, shown with its reading — agree or disagree with the call on the same facts."
                    >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {signals.map((s) => (
                                <SignalRow key={s.label} {...s} />
                            ))}
                        </div>
                    </Section>

                    <BottomLine tone={verdict.tone}>
                        <strong className="text-gray-100">{symbol}: {verdict.title}.</strong>{' '}
                        {verdict.text}
                    </BottomLine>
                </>
            );
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ToolHeader tool={tool} />
            <SymbolPicker
                actionPath="/analysis/trend-check"
                current={symbol ?? undefined}
                watchlist={watchlist}
                accentText={tool.text}
            />
            {body}
        </div>
    );
}

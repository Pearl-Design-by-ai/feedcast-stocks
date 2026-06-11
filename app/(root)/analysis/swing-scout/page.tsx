import type { Metadata } from 'next';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getAnalysisTool } from '@/lib/analysis';
import { getPickerWatchlist, symbolFromParams } from '@/lib/analysis-server';
import {
    ToolHeader,
    SymbolPicker,
    Section,
    StatCard,
    BottomLine,
    EmptyToolState,
    NoDataState,
    type Tone,
} from '@/components/analysis/AnalysisUi';
import { sma, highestClose, lowestClose, fmtUsd, fmtSignedPct } from '@/lib/technical';

export const metadata: Metadata = {
    title: 'Swing Scout',
    description: 'Swing structure, entry/stop/target framework and the risk/reward math for any ticker.',
};

const tool = getAnalysisTool('swing-scout')!;

export default async function SwingScoutPage({
    searchParams,
}: {
    searchParams: Promise<{ symbol?: string | string[] }>;
}) {
    const symbol = symbolFromParams(await searchParams);
    const watchlist = await getPickerWatchlist();

    let body: React.ReactNode = <EmptyToolState name="Swing Scout" />;

    if (symbol) {
        const series = await fetchDailyCloses(symbol);
        const closes = series.map((c) => c.close);
        if (closes.length < 70) {
            body = <NoDataState symbol={symbol} />;
        } else {
            const last = closes[closes.length - 1];
            const hi20 = highestClose(closes, 20)!;
            const lo20 = lowestClose(closes, 20)!;
            const hi63 = highestClose(closes, 63)!;
            const lo63 = lowestClose(closes, 63)!;
            const sma20 = sma(closes, 20);
            const rangePos = hi20 > lo20 ? ((last - lo20) / (hi20 - lo20)) * 100 : 50;

            // Framework plan: breakout entry above the 20d high, stop under the
            // 20d low (the most recent swing low closes can see), target at the
            // 3-month high. All from closes — labeled as a framework, not advice.
            const entry = hi20;
            const stop = lo20;
            const target = hi63 > hi20 ? hi63 : hi20 * 1.08; // prior resistance, else +8% extension
            const risk = entry - stop;
            const reward = target - entry;
            const rr = risk > 0 ? reward / risk : null;

            const rrTone: Tone = rr == null ? 'neutral' : rr >= 2 ? 'pos' : rr >= 1 ? 'warn' : 'neg';
            const posTone: Tone = rangePos >= 70 ? 'pos' : rangePos <= 30 ? 'neg' : 'neutral';

            body = (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard label="Last close" value={fmtUsd(last)} sub={symbol} />
                        <StatCard
                            label="20-day range"
                            value={`${fmtUsd(lo20)} – ${fmtUsd(hi20)}`}
                            sub="The active swing box"
                        />
                        <StatCard
                            label="Position in range"
                            value={`${rangePos.toFixed(0)}%`}
                            tone={posTone}
                            sub={
                                rangePos >= 70
                                    ? 'Pressing the top — breakout zone'
                                    : rangePos <= 30
                                      ? 'Near the lows — falling knife or value zone'
                                      : 'Mid-range — no edge from location'
                            }
                        />
                        <StatCard
                            label="3-month structure"
                            value={`${fmtUsd(lo63)} – ${fmtUsd(hi63)}`}
                            sub="Support – resistance from closes"
                        />
                    </div>

                    <Section
                        title="Framework plan"
                        subtitle="A structured way to think about the trade — entries, exits and the math. Not a recommendation."
                    >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    Entry trigger
                                </span>
                                <p className="mt-1 text-lg font-semibold tabular-nums text-gray-100">
                                    {fmtUsd(entry)}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                    A close above the 20-day high confirms buyers control the box.
                                    {sma20 != null &&
                                        ` Patient alternative: a pullback toward the 20-day average (${fmtUsd(sma20)}) that holds.`}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                                    Protective stop
                                </span>
                                <p className="mt-1 text-lg font-semibold tabular-nums text-gray-100">
                                    {fmtUsd(stop)}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                    Under the 20-day low — if price returns there after a breakout, the
                                    setup has failed and the loss is {fmtSignedPct(((stop - entry) / entry) * 100)} from entry.
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                    Target zone
                                </span>
                                <p className="mt-1 text-lg font-semibold tabular-nums text-gray-100">
                                    {fmtUsd(target)}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                    {hi63 > hi20
                                        ? 'The prior 3-month high — the most recent place sellers showed up.'
                                        : 'No overhead resistance in 3 months of data — a measured +8% extension is used instead.'}{' '}
                                    Upside from entry: {fmtSignedPct(((target - entry) / entry) * 100)}.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <BottomLine tone={rrTone}>
                        <strong className="text-gray-100">
                            {symbol}: risk/reward ≈ {rr != null ? rr.toFixed(1) : '—'} : 1.
                        </strong>{' '}
                        {rrTone === 'pos'
                            ? 'The math clears the classic 2:1 bar — if the trigger fires, the setup pays you for the risk. Position size off the stop, not off conviction.'
                            : rrTone === 'warn'
                              ? 'Playable but thin — you’re risking about as much as you stand to make. Either wait for a better entry (closer to support) or skip it.'
                              : rrTone === 'neg'
                                ? 'The math is against you: the stop is further than the target. This is how accounts bleed — pass and wait for a cleaner structure.'
                                : 'Insufficient structure to score — treat with caution.'}
                    </BottomLine>
                </>
            );
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ToolHeader tool={tool} />
            <SymbolPicker
                actionPath="/analysis/swing-scout"
                current={symbol ?? undefined}
                watchlist={watchlist}
                accentText={tool.text}
            />
            {body}
        </div>
    );
}

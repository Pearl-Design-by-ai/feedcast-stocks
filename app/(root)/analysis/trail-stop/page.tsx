import type { Metadata } from 'next';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getAnalysisTool } from '@/lib/analysis';
import { getPickerWatchlist, symbolFromParams } from '@/lib/analysis-server';
import {
    ToolHeader,
    SymbolPicker,
    Section,
    StatCard,
    SignalBadge,
    BottomLine,
    EmptyToolState,
    NoDataState,
    type Tone,
} from '@/components/analysis/AnalysisUi';
import { sma, ema, atrClose, highestClose, fmtUsd } from '@/lib/technical';

export const metadata: Metadata = {
    title: 'Trail Stop Planner',
    description: 'Four trailing-stop methods with live levels — pick the leash that fits your trade.',
};

const tool = getAnalysisTool('trail-stop')!;

interface StopMethod {
    name: string;
    level: number;
    character: string;
    tone: Tone;
    note: string;
}

export default async function TrailStopPage({
    searchParams,
}: {
    searchParams: Promise<{ symbol?: string | string[] }>;
}) {
    const symbol = symbolFromParams(await searchParams);
    const watchlist = await getPickerWatchlist();

    let body: React.ReactNode = <EmptyToolState name="the Trail Stop Planner" />;

    if (symbol) {
        const series = await fetchDailyCloses(symbol);
        const closes = series.map((c) => c.close);
        if (closes.length < 60) {
            body = <NoDataState symbol={symbol} />;
        } else {
            const last = closes[closes.length - 1];
            const e10 = ema(closes, 10);
            const e20 = ema(closes, 20);
            const s50 = sma(closes, 50);
            const atr = atrClose(closes, 14);
            const hi20 = highestClose(closes, 20);
            const chandelier = atr != null && hi20 != null ? hi20 - 2.5 * atr : null;

            const methods: StopMethod[] = [];
            if (e10 != null)
                methods.push({
                    name: 'EMA10 — tight',
                    level: e10,
                    character: 'Days-long momentum trades',
                    tone: 'pos',
                    note: 'Hugs price closely; locks gains fast but normal noise will tag it. Use when the move is vertical and you want out on the first stumble.',
                });
            if (e20 != null)
                methods.push({
                    name: 'EMA20 — medium',
                    level: e20,
                    character: 'Multi-week swings',
                    tone: 'warn',
                    note: 'The classic swing-trader leash: survives ordinary pullbacks, exits when the swing actually bends.',
                });
            if (s50 != null)
                methods.push({
                    name: 'SMA50 — loose',
                    level: s50,
                    character: 'Position / trend trades',
                    tone: 'neutral',
                    note: 'Gives the trend room to breathe and you back a lot of open profit in exchange. For moves you want to hold for months.',
                });
            if (chandelier != null)
                methods.push({
                    name: 'Volatility stop — adaptive',
                    level: chandelier,
                    character: 'Adapts to the stock’s own noise',
                    tone: 'pos',
                    note: '20-day high minus 2.5× average daily move (close-based ATR proxy). Wide in volatile names, tight in calm ones — the chandelier idea.',
                });

            // Order from tightest (highest level) to loosest.
            methods.sort((a, b) => b.level - a.level);

            const anyAbove = methods.some((m) => m.level >= last);

            body = (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard label="Symbol" value={symbol} sub={series[series.length - 1]?.date} />
                        <StatCard label="Last close" value={fmtUsd(last)} sub="All stop distances measured from here" />
                        <StatCard
                            label="Daily noise (≈ATR14)"
                            value={atr != null ? fmtUsd(atr) : '—'}
                            sub="Average close-to-close move"
                        />
                    </div>

                    <Section
                        title="Four leashes, one position"
                        subtitle="Tightest first. A stop above the current price means that method has already signaled an exit."
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <th className="px-3 py-2">Method</th>
                                        <th className="px-3 py-2">Stop level</th>
                                        <th className="px-3 py-2">Distance</th>
                                        <th className="px-3 py-2">Best for</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {methods.map((m) => {
                                        const dist = ((m.level - last) / last) * 100;
                                        const triggered = m.level >= last;
                                        return (
                                            <tr key={m.name} className="border-b border-gray-800/60 align-top">
                                                <td className="px-3 py-3">
                                                    <span className="font-semibold text-gray-100">{m.name}</span>
                                                    <p className="mt-1 max-w-[320px] text-xs leading-relaxed text-gray-400">
                                                        {m.note}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 font-semibold tabular-nums text-gray-200">
                                                    {fmtUsd(m.level)}
                                                </td>
                                                <td className="px-3 py-3 tabular-nums text-gray-300">
                                                    {dist > 0 ? '+' : ''}
                                                    {dist.toFixed(1)}%
                                                </td>
                                                <td className="px-3 py-3 text-xs text-gray-400">{m.character}</td>
                                                <td className="px-3 py-3">
                                                    {triggered ? (
                                                        <SignalBadge tone="neg">Already hit</SignalBadge>
                                                    ) : (
                                                        <SignalBadge tone="pos">Active</SignalBadge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <BottomLine tone={anyAbove ? 'warn' : 'pos'}>
                        {anyAbove ? (
                            <>
                                <strong className="text-gray-100">{symbol}:</strong> at least one method has
                                already signaled an exit — the tight leashes think this move is over. If
                                you’re still holding, you’re implicitly trading the looser timeframe; make
                                sure that’s a decision, not an accident.
                            </>
                        ) : (
                            <>
                                <strong className="text-gray-100">{symbol}:</strong> all four stops sit below
                                price — the move is intact on every timeframe. Pick ONE method that matches
                                your horizon and follow it mechanically; switching leashes mid-trade is how
                                winners get round-tripped.
                            </>
                        )}
                    </BottomLine>
                </>
            );
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ToolHeader tool={tool} />
            <SymbolPicker
                actionPath="/analysis/trail-stop"
                current={symbol ?? undefined}
                watchlist={watchlist}
                accentText={tool.text}
            />
            {body}
        </div>
    );
}

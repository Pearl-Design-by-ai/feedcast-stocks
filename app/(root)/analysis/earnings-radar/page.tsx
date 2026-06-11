import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getEarningsCalendar } from '@/lib/actions/calendar.actions';
import { getBullBear } from '@/lib/actions/deepseek.actions';
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
import { momentum, realizedVol, fmtSignedPct, fmtUsd } from '@/lib/technical';

export const metadata: Metadata = {
    title: 'Earnings Radar',
    description: 'Next report date, pre-earnings run-up, volatility context and the AI bull/bear case.',
};

const tool = getAnalysisTool('earnings-radar')!;

const HOUR_LABEL: Record<string, string> = {
    bmo: 'before the open',
    amc: 'after the close',
    dmh: 'during market hours',
};

async function BullBearCase({ symbol }: { symbol: string }) {
    const res = await getBullBear(symbol, symbol);
    if (!res || (res.bull.length === 0 && res.bear.length === 0)) return null;
    return (
        <Section
            title="AI bull vs bear"
            subtitle="Grounded in current data via the markets engine — both sides, so you argue with the better one."
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        The bull case
                    </span>
                    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-gray-300">
                        {res.bull.map((b) => (
                            <li key={b}>{b}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                        The bear case
                    </span>
                    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-gray-300">
                        {res.bear.map((b) => (
                            <li key={b}>{b}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    );
}

export default async function EarningsRadarPage({
    searchParams,
}: {
    searchParams: Promise<{ symbol?: string | string[] }>;
}) {
    const symbol = symbolFromParams(await searchParams);
    const watchlist = await getPickerWatchlist();

    let body: React.ReactNode = <EmptyToolState name="Earnings Radar" />;

    if (symbol) {
        const [series, calendar] = await Promise.all([
            fetchDailyCloses(symbol),
            getEarningsCalendar(45),
        ]);
        const closes = series.map((c) => c.close);

        if (closes.length < 30) {
            body = <NoDataState symbol={symbol} />;
        } else {
            const last = closes[closes.length - 1];
            const m1 = momentum(closes, 21);
            const m3 = momentum(closes, 63);
            const vol = realizedVol(closes, 20);
            const next = calendar.find((e) => e.symbol.toUpperCase() === symbol);
            const daysTo = next
                ? Math.max(0, Math.ceil((new Date(next.date).getTime() - Date.now()) / 86400_000))
                : null;

            const runupTone: Tone = m1 == null ? 'neutral' : m1 > 10 ? 'warn' : m1 < -10 ? 'warn' : 'pos';
            const volTone: Tone = vol == null ? 'neutral' : vol > 50 ? 'warn' : 'pos';

            body = (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            label="Next report"
                            value={next ? next.date : 'Not in the next 45 days'}
                            tone={next ? (daysTo != null && daysTo <= 7 ? 'warn' : 'neutral') : 'neutral'}
                            sub={
                                next
                                    ? `${daysTo} day${daysTo === 1 ? '' : 's'} away${next.hour && HOUR_LABEL[next.hour] ? ` · ${HOUR_LABEL[next.hour]}` : ''}`
                                    : 'No confirmed date on the calendar yet'
                            }
                        />
                        <StatCard
                            label="EPS estimate"
                            value={next?.epsEstimate != null ? `$${next.epsEstimate.toFixed(2)}` : '—'}
                            sub={next?.quarter ? `Q${next.quarter} ${next.year ?? ''}` : 'Street consensus'}
                        />
                        <StatCard
                            label="Run-up into the print"
                            value={m1 != null ? fmtSignedPct(m1) : '—'}
                            tone={runupTone}
                            sub={`1-month move · 3-month ${m3 != null ? fmtSignedPct(m3) : '—'}`}
                        />
                        <StatCard
                            label="Realized vol (20d)"
                            value={vol != null ? `${vol.toFixed(0)}%` : '—'}
                            tone={volTone}
                            sub={`Annualized · last close ${fmtUsd(last)}`}
                        />
                    </div>

                    <Section
                        title="How to read this setup"
                        subtitle="Earnings are a coin you don't control — the setup decides how expensive each side of the coin is."
                    >
                        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-gray-300">
                            <li>
                                {m1 != null && m1 > 10
                                    ? 'A big run-up means good news is at least partly pre-paid — beats can still sell off ("sell the news"), and misses get punished twice.'
                                    : m1 != null && m1 < -10
                                      ? 'A sold-off stock walks in with a lowered bar — in-line results can rally, but a guide-down confirms the downtrend.'
                                      : 'A quiet drift into the print means expectations look balanced — the reaction will mostly be about guidance, not the quarter.'}
                            </li>
                            <li>
                                {vol != null && vol > 50
                                    ? 'Realized volatility is already hot — position sizes should respect that the post-print gap can be a multiple of a normal day.'
                                    : 'Realized volatility is moderate — but remember the event gap prices off implied vol, which typically runs hotter into the date.'}
                            </li>
                            <li>
                                If you hold through the print, decide your reaction to BOTH outcomes before
                                the number drops — the worst plans are written at 4:05pm.
                            </li>
                        </ul>
                    </Section>

                    <Suspense
                        fallback={
                            <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                                Building the bull and bear case…
                            </div>
                        }
                    >
                        <BullBearCase symbol={symbol} />
                    </Suspense>

                    <BottomLine tone={next && daysTo != null && daysTo <= 7 ? 'warn' : 'neutral'}>
                        <strong className="text-gray-100">{symbol}:</strong>{' '}
                        {next
                            ? `reports ${next.date}${daysTo != null ? ` (${daysTo} day${daysTo === 1 ? '' : 's'})` : ''}. Whatever your lean, size the position so the worst-case gap is survivable — the radar's job is to make sure nothing on this page surprises you that night.`
                            : 'has no confirmed report date inside 45 days — event risk is low right now, and the technicals matter more than the calendar.'}
                    </BottomLine>
                </>
            );
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <ToolHeader tool={tool} />
            <SymbolPicker
                actionPath="/analysis/earnings-radar"
                current={symbol ?? undefined}
                watchlist={watchlist}
                accentText={tool.text}
            />
            {body}
        </div>
    );
}

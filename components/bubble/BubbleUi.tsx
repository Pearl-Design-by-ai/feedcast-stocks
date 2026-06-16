/**
 * Presentational pieces for the Bubble Detector (server-safe, no hooks).
 */

import Link from 'next/link';
import { cn, formatEodDate } from '@/lib/utils';
import { bubbleBand, PHASE_LABEL, PHASE_TONE, type AssetBubble, type Phase } from '@/lib/bubble';

type Tone = 'pos' | 'warn' | 'neg' | 'neutral';

const TONE_TEXT: Record<Tone, string> = {
    pos: 'text-emerald-400',
    warn: 'text-amber-400',
    neg: 'text-red-400',
    neutral: 'text-gray-300',
};
const TONE_CHIP: Record<Tone, string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    warn: 'bg-amber-400/10 text-amber-400',
    neg: 'bg-red-400/10 text-red-400',
    neutral: 'bg-gray-700/60 text-gray-300',
};

function pct(v: number | null, digits = 1) {
    if (v == null) return '—';
    return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

/**
 * Plain-language read of the headline number, made honest by coverage: a low
 * score with few names scored means "feed is thin," not "all calm."
 */
function frothVerdict(value: number, scored: number, universe: number): string {
    if (universe > 0 && scored / universe < 0.5) {
        return `Only ${scored} of ${universe} tracked names returned live data, so this reading is incomplete — treat it as a partial snapshot, not the full picture.`;
    }
    if (value >= 75) return 'Speculative assets are deep in bubble territory — stretched far above trend on euphoric momentum across the board.';
    if (value >= 55) return 'Clearly frothy: prices are running well ahead of trend in several themes. Not a crash call, but the risk-of-pop is elevated.';
    if (value >= 30) return 'Elevated but not manic — pockets of froth rather than a market-wide bubble. Watch the themes scoring highest below.';
    return 'No active bubble right now. Prices across the speculative themes are near or below trend — note that names which already deflated read calm here, even if they were a mania last year.';
}

/** Big 0–100 froth gauge — green (calm) → amber → red (bubble). */
export function FrothGauge({
    value,
    asOf,
    dataDate,
    scored,
    universe,
    phaseCounts,
}: {
    value: number;
    asOf: string;
    dataDate?: string;
    scored: number;
    universe: number;
    phaseCounts: Record<Phase, number>;
}) {
    const band = bubbleBand(value);
    const inflating = phaseCounts.inflating;
    const cracking = phaseCounts.cracking;
    const popping = phaseCounts.popping;
    const calm = phaseCounts.calm;
    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 md:p-6">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Market Froth Index
                    </p>
                    <p className={cn('mt-1 text-5xl font-bold tabular-nums', TONE_TEXT[band.tone])}>
                        {value}
                        <span className="ml-1 text-2xl text-gray-600">/100</span>
                    </p>
                </div>
                <div className="text-right">
                    <span
                        className={cn(
                            'rounded-md px-2 py-1 text-sm font-semibold',
                            TONE_CHIP[band.tone]
                        )}
                    >
                        {band.label}
                    </span>
                    <p className="mt-1 text-[11px] text-gray-500">
                        {dataDate ? <>EOD data through {formatEodDate(dataDate)} · refreshed {asOf}</> : <>as of {asOf}</>}
                    </p>
                </div>
            </div>
            <div className="relative mb-1 mt-8">
                {/* gradient track (clipped) */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
                {/* marker sits OUTSIDE the clipped track so it's fully visible:
                    a value bubble above a white knob with a dark ring. */}
                <div
                    className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${Math.min(96, Math.max(4, value))}%` }}
                >
                    <span className={cn('absolute -top-7 left-1/2 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-950 shadow', band.tone === 'neg' ? 'bg-red-400' : band.tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-400')}>
                        {value}
                    </span>
                    <span className="block h-5 w-5 rounded-full border-[3px] border-gray-950 bg-white shadow-lg" />
                </div>
            </div>
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-gray-600">
                <span>Calm</span>
                <span>Frothy</span>
                <span>Bubble</span>
            </div>

            {/* What the number means right now */}
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
                {frothVerdict(value, scored, universe)}
            </p>

            {/* Why — phase mix + coverage */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
                <span>
                    <span className="font-semibold text-gray-300">{scored}</span>/{universe} names scored
                </span>
                {inflating > 0 && <span className="text-red-400">{inflating} inflating</span>}
                {cracking > 0 && <span className="text-amber-400">{cracking} cracking</span>}
                {popping > 0 && <span className="text-amber-400">{popping} deflating</span>}
                {calm > 0 && <span className="text-emerald-400">{calm} calm</span>}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-500">
                A blend of trend extension, run-up, RSI and proximity to 52-week highs across the
                speculative themes below (excluding the broad-market baseline). It measures how
                inflated assets are <span className="text-gray-400">today</span> — not whether they
                were ever a bubble. Heuristic, not advice.
            </p>
        </div>
    );
}

/** Horizontal 0–100 score bar with a colored fill. */
export function ScoreBar({ value, barClass }: { value: number; barClass?: string }) {
    const band = bubbleBand(value);
    const fill = barClass ?? (band.tone === 'neg' ? 'bg-red-400' : band.tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-400');
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div className={cn('h-full rounded-full', fill)} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-300">{value}</span>
        </div>
    );
}

export function PhaseChip({ phase }: { phase: AssetBubble['phase'] }) {
    return (
        <span className={cn('inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold', TONE_CHIP[PHASE_TONE[phase]])}>
            {PHASE_LABEL[phase]}
        </span>
    );
}

/** Per-asset table used inside each theme. */
export function AssetTable({ assets }: { assets: AssetBubble[] }) {
    if (assets.length === 0) {
        return <p className="text-xs text-gray-500">Live data unavailable for this theme right now.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2">1Y</th>
                        <th className="px-3 py-2">vs 200d</th>
                        <th className="px-3 py-2">RSI</th>
                        <th className="px-3 py-2">From high</th>
                        <th className="px-3 py-2 w-40">Bubble score</th>
                        <th className="px-3 py-2">Phase</th>
                        <th className="px-3 py-2 text-right">Pop risk</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((a) => (
                        <tr key={a.symbol} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                            <td className="px-3 py-2.5">
                                <Link href={`/stocks/${a.symbol}`} className="font-semibold text-gray-100 hover:text-teal-400">
                                    {a.symbol}
                                </Link>
                                {a.limitedHistory && (
                                    <span className="ml-1 text-[10px] text-gray-600" title="Under ~1 year of price history">*</span>
                                )}
                            </td>
                            <td className={cn('px-3 py-2.5 tabular-nums', a.ret1Y != null && a.ret1Y < 0 ? 'text-red-400' : 'text-gray-200')}>
                                {pct(a.ret1Y)}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-300">{pct(a.ext200)}</td>
                            <td className={cn('px-3 py-2.5 tabular-nums', a.rsi != null && a.rsi >= 70 ? 'text-red-400' : 'text-gray-300')}>
                                {a.rsi != null ? a.rsi.toFixed(0) : '—'}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-gray-300">{pct(a.offHigh)}</td>
                            <td className="px-3 py-2.5"><ScoreBar value={a.bubbleScore} /></td>
                            <td className="px-3 py-2.5"><PhaseChip phase={a.phase} /></td>
                            <td className={cn('px-3 py-2.5 text-right font-semibold tabular-nums', a.popRisk >= 60 ? 'text-red-400' : a.popRisk >= 35 ? 'text-amber-400' : 'text-gray-300')}>
                                {a.popRisk}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

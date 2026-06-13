/**
 * Presentational pieces for the Bubble Detector (server-safe, no hooks).
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { bubbleBand, PHASE_LABEL, PHASE_TONE, type AssetBubble } from '@/lib/bubble';

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

/** Big 0–100 froth gauge — red (calm) → amber → red again at the top. */
export function FrothGauge({ value, asOf }: { value: number; asOf: string }) {
    const band = bubbleBand(value);
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
                    <p className="mt-1 text-[11px] text-gray-500">as of {asOf}</p>
                </div>
            </div>
            <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500">
                <div
                    className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white shadow"
                    style={{ left: `calc(${Math.min(100, Math.max(0, value))}% - 2px)` }}
                />
            </div>
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-gray-600">
                <span>Calm</span>
                <span>Frothy</span>
                <span>Bubble</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">
                A blend of trend extension, run-up, RSI and proximity to 52-week highs across the
                speculative themes below (excluding the broad-market baseline). Higher = more
                inflated. Heuristic, not advice.
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

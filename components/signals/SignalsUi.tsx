/**
 * Presentational pieces for the Buy & Sell Signals page (server-safe).
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRADE_META, type IndexSignal, type SubState } from '@/lib/signals';

const GRADE_TONE: Record<'pos2' | 'pos' | 'neutral' | 'neg' | 'neg2', { text: string; chip: string; bar: string }> = {
    pos2: { text: 'text-emerald-400', chip: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-400/40', bar: 'bg-emerald-400' },
    pos: { text: 'text-green-400', chip: 'bg-green-500/10 text-green-400', bar: 'bg-green-400' },
    neutral: { text: 'text-gray-300', chip: 'bg-gray-700/60 text-gray-300', bar: 'bg-gray-500' },
    neg: { text: 'text-red-400', chip: 'bg-red-500/10 text-red-400', bar: 'bg-red-400' },
    neg2: { text: 'text-red-400', chip: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-400/40', bar: 'bg-red-500' },
};

const SUB_TONE: Record<SubState, string> = {
    bull: 'bg-emerald-400/10 text-emerald-400',
    neutral: 'bg-gray-700/60 text-gray-400',
    bear: 'bg-red-400/10 text-red-400',
};

const fmtNum = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 0 : 2 });

/** One index card: grade, score gauge, day move, sub-signals, levels, outlook. */
export function SignalCard({ s }: { s: IndexSignal }) {
    const meta = GRADE_META[s.grade];
    const tone = GRADE_TONE[meta.tone];
    const up = (s.dayChangePct ?? 0) >= 0;

    return (
        <div className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            {/* Header: name + grade */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-100">{s.name}</h3>
                    <p className="text-[11px] text-gray-500">{s.blurb}</p>
                </div>
                <span className={cn('shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold', tone.chip)}>
                    {meta.label}
                </span>
            </div>

            {/* Price + day move */}
            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-gray-100">{fmtNum(s.last)}</span>
                {s.dayChangePct != null && (
                    <span className={cn('inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums', up ? 'text-green-400' : 'text-red-400')}>
                        {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {Math.abs(s.dayChangePct).toFixed(2)}%
                    </span>
                )}
                {s.limited && <span className="text-[10px] text-gray-600" title="Under ~1 year of history">*</span>}
            </div>

            {/* Score gauge 0–100 */}
            <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                    <span>Sell</span><span>Hold</span><span>Buy</span>
                </div>
                <div className="relative mt-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
                    <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-950 bg-white shadow"
                        style={{ left: `${Math.min(96, Math.max(4, s.score))}%` }}
                    />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-gray-500">
                    Signal score <span className={cn('font-bold', tone.text)}>{s.score}</span>/100
                </p>
            </div>

            {/* Sub-signals */}
            <ul className="mt-3 flex flex-col divide-y divide-gray-800/70">
                {s.subs.map((sub) => (
                    <li key={sub.label} className="flex items-start justify-between gap-3 py-2">
                        <div className="min-w-0">
                            <span className="text-xs font-medium text-gray-300">{sub.label}</span>
                            <p className="text-[11px] leading-relaxed text-gray-500">{sub.detail}</p>
                        </div>
                        <span className={cn('mt-0.5 inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold', SUB_TONE[sub.state])}>
                            {sub.state === 'bull' ? <ArrowUp size={10} /> : sub.state === 'bear' ? <ArrowDown size={10} /> : <Minus size={10} />}
                            {sub.state === 'bull' ? 'Bullish' : sub.state === 'bear' ? 'Bearish' : 'Neutral'}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Levels */}
            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Support</p>
                    {s.support ? (
                        <p className="text-sm font-semibold tabular-nums text-gray-200">{fmtNum(s.support.level)}<span className="ml-1 text-[10px] font-normal text-gray-500">{s.support.label}</span></p>
                    ) : <p className="text-sm text-gray-500">—</p>}
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Resistance</p>
                    {s.resistance ? (
                        <p className="text-sm font-semibold tabular-nums text-gray-200">{fmtNum(s.resistance.level)}<span className="ml-1 text-[10px] font-normal text-gray-500">{s.resistance.label}</span></p>
                    ) : <p className="text-sm text-gray-200">New highs</p>}
                </div>
            </div>

            {/* Forward outlook */}
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-teal-300">Next-session read</p>
                <p className="text-xs leading-relaxed text-gray-300">{s.outlook}</p>
            </div>
        </div>
    );
}

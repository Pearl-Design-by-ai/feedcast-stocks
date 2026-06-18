/**
 * Presentational pieces for the Leverage Rotation screen (server-safe). One card
 * per 1x↔3x pair: the recommended split, an effective-exposure read, the
 * sub-signals behind it, and an "if the market moves" ladder. Violet/fuchsia
 * accents flag the 3x sleeve, teal the 1x ballast.
 */

import { ArrowUp, ArrowDown, Minus, Rocket, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeveragePair, LevAction, SubState } from '@/lib/leverage';

const fmtNum = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 0 : 2 });

const SUB_TONE: Record<SubState, string> = {
    bull: 'bg-emerald-400/10 text-emerald-400',
    neutral: 'bg-gray-700/60 text-gray-400',
    bear: 'bg-red-400/10 text-red-400',
};

const STANCE_TONE: Record<'pos' | 'neutral' | 'neg', string> = {
    pos: 'bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/40',
    neutral: 'bg-gray-700/60 text-gray-300',
    neg: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/40',
};

/** add/lever-up=violet, hold=gray, trim=amber, de-lever=red. */
const ACTION_TONE: Record<LevAction, { chip: string; dot: string }> = {
    'lever-up': { chip: 'bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-400/30', dot: 'bg-violet-400' },
    hold: { chip: 'bg-gray-700/60 text-gray-300', dot: 'bg-gray-500' },
    trim: { chip: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-400/30', dot: 'bg-amber-400' },
    'de-lever': { chip: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-400/30', dot: 'bg-red-400' },
};

const ACTION_LABEL: Record<LevAction, string> = {
    'lever-up': 'Lever up',
    hold: 'Hold',
    trim: 'Trim',
    'de-lever': 'De-lever',
};

/** One pair card: QQQ↔TQQQ or SPY↔SPXL. */
export function LeveragePairCard({ p }: { p: LeveragePair }) {
    const lev = Math.min(100, Math.max(0, p.leveragedPct));
    const base = Math.min(100, Math.max(0, p.basePct));
    const up = (p.dayChangePct ?? 0) >= 0;

    return (
        <div className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-100">{p.market}</h3>
                    <p className="text-[11px] text-gray-500">{p.blurb}</p>
                </div>
                <span className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold', STANCE_TONE[p.tone])}>
                    {p.stance}
                </span>
            </div>

            {/* Base ETF price + day move */}
            <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-[11px] text-gray-500">{p.baseSymbol}</span>
                <span className="text-2xl font-bold tabular-nums text-gray-100">{fmtNum(p.last)}</span>
                {p.dayChangePct != null && (
                    <span className={cn('inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums', up ? 'text-green-400' : 'text-red-400')}>
                        {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {Math.abs(p.dayChangePct).toFixed(2)}%
                    </span>
                )}
                {p.limited && <span className="text-[10px] text-gray-600" title="Under ~1 year of history">*</span>}
            </div>

            {/* The recommended split — the headline of the card */}
            <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-4">
                <div className="flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                        <Rocket size={16} className="self-center text-violet-300" />
                        <span className="text-3xl font-bold tabular-nums text-violet-300">{lev}%</span>
                        <span className="text-sm font-semibold text-violet-300/90">{p.leveragedSymbol}</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-right">
                        <span className="text-2xl font-bold tabular-nums text-teal-300">{base}%</span>
                        <span className="text-sm font-semibold text-teal-300/90">{p.baseSymbol}</span>
                    </div>
                </div>
                <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-800">
                    <div className="h-full bg-violet-400" style={{ width: `${lev}%` }} />
                    <div className="h-full bg-teal-400" style={{ width: `${base}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-gray-400">
                        <ShieldCheck size={12} className="text-teal-300" /> Always 100% invested
                    </span>
                    <span className="tabular-nums text-gray-400">
                        Effective exposure <span className="font-bold text-violet-300">≈{p.effExposure.toFixed(2)}x</span>
                    </span>
                </div>
            </div>

            {/* Leverage-appetite gauge */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
                    <span>1x only</span><span>Balanced</span><span>Max 3x</span>
                </div>
                <div className="relative mt-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-gray-500 to-violet-500" />
                    <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-950 bg-white shadow"
                        style={{ left: `${Math.min(96, Math.max(4, p.score))}%` }}
                    />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-gray-500">
                    Leverage score <span className="font-bold text-violet-300">{p.score}</span>/100
                </p>
            </div>

            {/* Sub-signals */}
            <ul className="mt-3 flex flex-col divide-y divide-gray-800/70">
                {p.subs.map((sub) => (
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

            {/* Rationale */}
            <p className="mt-3 rounded-lg bg-gray-800/50 p-3 text-xs leading-relaxed text-gray-300">{p.rationale}</p>

            {/* Scenario ladder */}
            {p.ladder.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">When {p.baseSymbol} moves — the ladder</p>
                    <ul className="flex flex-col gap-2">
                        {p.ladder.map((step, i) => {
                            const tone = ACTION_TONE[step.action];
                            return (
                                <li key={i} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold', tone.chip)}>
                                                    <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                                                    {ACTION_LABEL[step.action]}
                                                </span>
                                                <span className="truncate text-xs font-semibold text-gray-200">{step.scenario}</span>
                                            </div>
                                            {(step.movePct != null || step.level != null) && (
                                                <p className="mt-1 text-[11px] tabular-nums text-gray-500">
                                                    {step.movePct != null && <span>{step.movePct > 0 ? '+' : ''}{step.movePct.toFixed(1)}%</span>}
                                                    {step.movePct != null && step.level != null && <span> · </span>}
                                                    {step.level != null && <span>{p.baseSymbol} {fmtNum(step.level)}</span>}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-right text-[11px] font-semibold tabular-nums">
                                            <span className="text-violet-300">{step.leveragedPct}%</span>
                                            <span className="text-gray-500"> / </span>
                                            <span className="text-teal-300">{step.basePct}%</span>
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">{step.note}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

/** Small day-trend chip reused if needed. */
export function MiniTrend({ up }: { up: boolean }) {
    return up
        ? <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-400"><TrendingUp size={12} />up</span>
        : <span className="inline-flex items-center gap-0.5 text-[11px] text-red-400"><TrendingDown size={12} />down</span>;
}

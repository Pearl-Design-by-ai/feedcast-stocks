/**
 * Presentational pieces for the Buy & Sell Signals page (server-safe).
 */

import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRADE_META, type IndexSignal, type SubState, type MacroRead, type SignalTrend } from '@/lib/signals';

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

/** Week-over-week signal-trend chip. */
function TrendChip({ trend, delta }: { trend: SignalTrend; delta: number | null }) {
    if (trend === 'improving') return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400"><TrendingUp size={12} />improving{delta != null ? ` +${delta}` : ''}</span>;
    if (trend === 'weakening') return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-400"><TrendingDown size={12} />weakening{delta != null ? ` ${delta}` : ''}</span>;
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-500"><Minus size={12} />steady</span>;
}

const MACRO_TONE: Record<'pos' | 'neutral' | 'neg', string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    neg: 'text-red-400',
};

/** Macro backdrop strip — the risk environment around the index calls. */
export function MacroStrip({ macro }: { macro: MacroRead[] }) {
    if (macro.length === 0) return null;
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-100">Macro backdrop <span className="font-normal text-gray-500">— the environment for stocks</span></h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {macro.map((m) => (
                    <div key={m.key} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{m.name}</span>
                            <span className={cn('text-[11px] tabular-nums', m.dayUp ? 'text-green-400' : 'text-red-400')}>{m.dayChange}</span>
                        </div>
                        <p className={cn('mt-1 text-xl font-bold tabular-nums', MACRO_TONE[m.tone])}>{m.value}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{m.read}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Compact sector board — every SPDR sector graded, sorted strongest first. */
export function SectorBoard({ sectors }: { sectors: IndexSignal[] }) {
    if (sectors.length === 0) return null;
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="text-base font-semibold text-gray-100">Sector signals</h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">All 11 S&amp;P sectors on the same engine — strongest at the top. Favor green, avoid red.</p>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2">Sector</th>
                            <th className="px-3 py-2">Day</th>
                            <th className="px-3 py-2 w-40">Signal score</th>
                            <th className="px-3 py-2">Trend</th>
                            <th className="px-3 py-2 text-right">Call</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectors.map((s) => {
                            const meta = GRADE_META[s.grade];
                            const tone = GRADE_TONE[meta.tone];
                            const up = (s.dayChangePct ?? 0) >= 0;
                            const delta = s.scorePrev != null ? s.score - s.scorePrev : null;
                            return (
                                <tr key={s.key} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                                    <td className="px-3 py-2.5 font-semibold text-gray-100">{s.name} <span className="ml-1 font-mono text-[10px] text-gray-500">{s.symbol}</span></td>
                                    <td className={cn('px-3 py-2.5 tabular-nums text-xs', up ? 'text-green-400' : 'text-red-400')}>{s.dayChangePct != null ? `${up ? '+' : ''}${s.dayChangePct.toFixed(2)}%` : '—'}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800">
                                                <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${s.score}%` }} />
                                            </div>
                                            <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-300">{s.score}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5"><TrendChip trend={s.trend} delta={delta} /></td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={cn('rounded px-2 py-0.5 text-[11px] font-bold', tone.chip)}>{meta.label}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

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
                <div className="mt-1 flex items-center justify-between">
                    <TrendChip trend={s.trend} delta={s.scorePrev != null ? s.score - s.scorePrev : null} />
                    <p className="text-[11px] tabular-nums text-gray-500">
                        Signal score <span className={cn('font-bold', tone.text)}>{s.score}</span>/100
                    </p>
                </div>
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

            {/* End-of-year projection */}
            {s.projection && (
                <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.projection.year} end-of-year scenarios</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-emerald-400">Upside</p>
                            <p className="text-sm font-bold tabular-nums text-gray-100">{fmtNum(s.projection.up)}</p>
                            <p className="text-[11px] tabular-nums text-emerald-400">+{s.projection.upPct.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">Base</p>
                            <p className="text-sm font-bold tabular-nums text-gray-100">{fmtNum(s.projection.base)}</p>
                            <p className={cn('text-[11px] tabular-nums', s.projection.basePct >= 0 ? 'text-gray-300' : 'text-red-400')}>{s.projection.basePct >= 0 ? '+' : ''}{s.projection.basePct.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-red-400">Downside</p>
                            <p className="text-sm font-bold tabular-nums text-gray-100">{fmtNum(s.projection.down)}</p>
                            <p className="text-[11px] tabular-nums text-red-400">{s.projection.downPct.toFixed(1)}%</p>
                        </div>
                    </div>
                    <p className="mt-2 border-t border-gray-800 pt-2 text-[11px] leading-relaxed text-gray-400">
                        A typical correction from here (~{fmtNum(s.projection.correction)}, {s.projection.correctionPct.toFixed(0)}%) has
                        historically taken <span className="font-semibold text-gray-300">{s.projection.recovery}</span> to recover its prior peak.
                    </p>
                </div>
            )}

            {/* Forward outlook */}
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-teal-300">Next-session read</p>
                <p className="text-xs leading-relaxed text-gray-300">{s.outlook}</p>
            </div>
        </div>
    );
}

const TONE_TEXT: Record<'pos' | 'neutral' | 'neg', string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    neg: 'text-red-400',
};

/** Per-action styling for the ladder badges. add=green, hold=gray, trim=amber, de-risk=red. */
const ACTION_TONE: Record<import('@/lib/signals-scan').AllocAction, { chip: string; dot: string }> = {
    add: { chip: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-400/30', dot: 'bg-emerald-400' },
    hold: { chip: 'bg-gray-700/60 text-gray-300', dot: 'bg-gray-500' },
    trim: { chip: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-400/30', dot: 'bg-amber-400' },
    'de-risk': { chip: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-400/30', dot: 'bg-red-400' },
};

const ACTION_LABEL: Record<import('@/lib/signals-scan').AllocAction, string> = {
    add: 'Add',
    hold: 'Hold',
    trim: 'Trim',
    'de-risk': 'De-risk',
};

/** Tactical equity/cash tilt with a scenario ladder — sits under the market tone summary. */
export function TacticalCard({ t }: { t: import('@/lib/signals-scan').TacticalAllocation }) {
    const equity = Math.min(100, Math.max(0, t.equityPct));
    const cash = Math.min(100, Math.max(0, t.cashPct));

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-base font-semibold text-gray-100">Tactical allocation</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Suggested equity/cash tilt around <span className="text-gray-300">{t.anchor}</span>
                        {t.anchorLevel != null && <span className="tabular-nums text-gray-400"> · {fmtNum(t.anchorLevel)}</span>}
                    </p>
                </div>
                <span className={cn('text-sm font-bold', TONE_TEXT[t.tone])}>{t.stance}</span>
            </div>

            {/* Equity vs cash bar */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums">
                    <span className="text-teal-300">Equity {equity}%</span>
                    <span className="text-gray-400">Cash {cash}%</span>
                </div>
                <div className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <div className="h-full bg-teal-400" style={{ width: `${equity}%` }} />
                    <div className="h-full bg-gray-600" style={{ width: `${cash}%` }} />
                </div>
            </div>

            {/* Reads */}
            <p className="mt-4 text-sm leading-relaxed text-gray-300">{t.rationale}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Volatility</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{t.volNote}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Trend</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{t.trendNote}</p>
                </div>
            </div>

            {/* Scenario ladder */}
            {t.ladder.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">If the market moves — the ladder</p>
                    <ul className="flex flex-col gap-2">
                        {t.ladder.map((step, i) => {
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
                                                    {step.level != null && <span>{fmtNum(step.level)}</span>}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-right text-[11px] font-semibold tabular-nums text-gray-400">
                                            <span className="text-teal-300">{step.equityPct}%</span> / {step.cashPct}%
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">{step.note}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <p className="mt-4 text-[10px] leading-relaxed text-gray-600">{t.disclaimer}</p>
        </div>
    );
}

const DD_TONE: Record<'pos' | 'neutral' | 'warn' | 'neg', string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    warn: 'text-amber-400',
    neg: 'text-red-400',
};

/** Historical drawdown → recovery statistics. */
export function RecoveryStats({ stats }: { stats: import('@/lib/market-history').DrawdownStat[] }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="text-base font-semibold text-gray-100">Corrections &amp; recovery — the statistics</h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">
                How deep selloffs usually run and how long they&apos;ve taken to recover the prior peak (S&amp;P 500,
                long-run averages). Drawdowns are frequent and temporary — every cycle differs.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2">Drawdown</th>
                            <th className="px-3 py-2">Frequency</th>
                            <th className="px-3 py-2">Avg decline</th>
                            <th className="px-3 py-2">Time to recover</th>
                            <th className="px-3 py-2">Character</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((d) => (
                            <tr key={d.band} className="border-b border-gray-800/60">
                                <td className={cn('px-3 py-2.5 font-semibold', DD_TONE[d.tone])}>{d.band}</td>
                                <td className="px-3 py-2.5 text-xs text-gray-400">{d.frequency}</td>
                                <td className="px-3 py-2.5 tabular-nums text-gray-300">{d.avgDecline}</td>
                                <td className="px-3 py-2.5 font-semibold tabular-nums text-gray-200">{d.recovery}</td>
                                <td className="px-3 py-2.5 text-xs text-gray-400">{d.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** The fundamental long-run case for US equities. */
export function WhyMarketsRise({ reasons }: { reasons: import('@/lib/market-history').WhyUp[] }) {
    return (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4 md:p-5">
            <h2 className="text-base font-semibold text-emerald-400">Why US markets rise over the long run</h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">
                Signals are short-term. The reason the long-term trend is up is fundamental — here&apos;s the case, with examples.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {reasons.map((r) => (
                    <div key={r.title} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3.5">
                        <p className="text-sm font-semibold text-gray-100">{r.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{r.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Smart-money tracks ───────────────────────────────────────────────────────

const SMART_STATE_META: Record<import('@/lib/signals-scan').SmartState, { label: string; chip: string; dot: string }> = {
    bull: { label: 'Bullish', chip: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-400/40', dot: 'bg-emerald-400' },
    neutral: { label: 'Neutral', chip: 'bg-gray-700/60 text-gray-300', dot: 'bg-gray-500' },
    bear: { label: 'Bearish', chip: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-400/40', dot: 'bg-red-400' },
};

const SMART_ITEM_TONE: Record<'pos' | 'neutral' | 'neg', string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    neg: 'text-red-400',
};

/**
 * Smart Money Tracks — what the informed players are doing: prediction-market
 * odds (Polymarket), corporate-insider Form 4 flow, and disclosed congressional
 * trading. Computed in the engine; this only renders the read.
 */
export function SmartMoneyBoard({ sm }: { sm: import('@/lib/signals-scan').SmartMoney }) {
    if (!sm.tracks.length) return null;
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-gray-100">
                Smart money tracks <span className="font-normal text-gray-500">— what the informed players are doing</span>
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-gray-500">{sm.note}</p>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {sm.tracks.map((t) => {
                    const meta = SMART_STATE_META[t.state];
                    return (
                        <div key={t.key} className="flex flex-col rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-100">{t.name}</p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">{t.blurb}</p>
                                </div>
                                <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.chip)}>
                                    <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                                    {meta.label}
                                </span>
                            </div>
                            <p className="mt-2 text-[13px] font-medium text-gray-200">{t.headline}</p>
                            <ul className="mt-2 space-y-1.5">
                                {t.items.map((it) => (
                                    <li key={it.label} className="flex items-baseline justify-between gap-2 text-xs">
                                        <span className="text-gray-400">{it.label}</span>
                                        <span className={cn('font-semibold tabular-nums', SMART_ITEM_TONE[it.tone])}>{it.value}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2.5 border-t border-gray-800 pt-2 text-[11px] leading-relaxed text-gray-500">{t.detail}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

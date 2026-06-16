/**
 * Presentational pieces for the Crash Detector (server-safe, no hooks).
 */

import { cn } from '@/lib/utils';
import {
    CLASS_LABEL,
    CLASS_TONE,
    probRange,
    type CrashIndicator,
    type Classification,
    type CrashBand,
    type CrashCyclePosition,
    type HistoricalAnalog,
    type CrashProbabilities,
    type CrashScenario,
} from '@/lib/crash';

type Tone = 'pos' | 'neutral' | 'warn' | 'neg' | 'crit';

const TONE_TEXT: Record<Tone, string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    warn: 'text-amber-400',
    neg: 'text-red-400',
    crit: 'text-red-400',
};
const TONE_CHIP: Record<Tone, string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    neutral: 'bg-gray-700/60 text-gray-300',
    warn: 'bg-amber-400/10 text-amber-400',
    neg: 'bg-red-400/10 text-red-400',
    crit: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-400/40',
};

function classChip(c: Classification) {
    return TONE_CHIP[CLASS_TONE[c]];
}

/** Big 0–100 cycle-risk gauge — green (recovery) → amber (mid) → red (crash watch). */
export function CrashGauge({
    score,
    band,
    asOf,
    liveCount,
    structuralCount,
    summary,
}: {
    score: number;
    band: CrashBand;
    asOf: string;
    liveCount: number;
    structuralCount: number;
    summary: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 md:p-6">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Crash Detector Score
                    </p>
                    <p className={cn('mt-1 text-5xl font-bold tabular-nums', TONE_TEXT[band.tone])}>
                        {score}
                        <span className="ml-1 text-2xl text-gray-600">/100</span>
                    </p>
                </div>
                <div className="text-right">
                    <span className={cn('rounded-md px-2 py-1 text-sm font-semibold', TONE_CHIP[band.tone])}>
                        {band.label}
                    </span>
                    <p className="mt-1 text-[11px] text-gray-500">as of {asOf}</p>
                </div>
            </div>

            {/* Gradient track with the marker + the six phase ticks. */}
            <div className="relative mb-1 mt-8">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
                <div
                    className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${Math.min(96, Math.max(4, score))}%` }}
                >
                    <span className={cn('absolute -top-7 left-1/2 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-950 shadow', TONE_CHIP[band.tone].includes('emerald') ? 'bg-emerald-400' : band.tone === 'warn' || band.tone === 'neutral' ? 'bg-amber-400' : 'bg-red-400')}>
                        {score}
                    </span>
                    <span className="block h-5 w-5 rounded-full border-[3px] border-gray-950 bg-white shadow-lg" />
                </div>
            </div>
            <div className="mt-1 flex justify-between text-[9px] uppercase tracking-wider text-gray-600">
                <span>Value</span>
                <span>Early</span>
                <span>Mid</span>
                <span>Late</span>
                <span>High</span>
                <span>Bubble</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-300">{band.blurb}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{summary}</p>

            <p className="mt-3 text-[11px] text-gray-500">
                Composite of <span className="font-semibold text-gray-300">{liveCount}</span> live market signals
                {' + '}<span className="font-semibold text-gray-300">{structuralCount}</span> structural/cycle reads,
                weighted by historical predictive power. Heuristic and informational — a probability statement, not a forecast.
            </p>
        </div>
    );
}

/** The probability table. */
export function ProbabilityTable({ p }: { p: CrashProbabilities }) {
    const rows: Array<{ label: string; value: number; tone: Tone; note: string }> = [
        { label: 'Continued bull market (next 12m)', value: p.bull12m, tone: 'pos', note: 'Index higher 12 months out' },
        { label: '15–25% correction', value: p.correction, tone: 'warn', note: 'A normal cyclical pullback at some point' },
        { label: 'Recession (next 12–18m)', value: p.recession, tone: 'warn', note: 'Two-quarter contraction / NBER call' },
        { label: '30%+ bear market', value: p.bear, tone: 'neg', note: 'A major peak-to-trough decline' },
        { label: 'Systemic financial crisis', value: p.systemic, tone: 'crit', note: 'Credit-event / forced-deleveraging tail' },
    ];
    return (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">Scenario (12 months unless noted)</th>
                        <th className="px-4 py-3 text-right">Estimate</th>
                        <th className="px-4 py-3 text-right w-28">Range</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.label} className="border-b border-gray-800/60 last:border-0">
                            <td className="px-4 py-3">
                                <div className="font-medium text-gray-200">{r.label}</div>
                                <div className="text-[11px] text-gray-500">{r.note}</div>
                            </td>
                            <td className={cn('px-4 py-3 text-right text-lg font-bold tabular-nums', TONE_TEXT[r.tone])}>{r.value}%</td>
                            <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-500">{probRange(r.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="border-t border-gray-800 px-4 py-2.5 text-[11px] leading-relaxed text-gray-500">
                Model-derived from the composite score — illustrative, not a forecast. The events are
                <span className="text-gray-400"> not mutually exclusive</span> (a correction can precede a recession), so they don&apos;t sum to 100%.
            </p>
        </div>
    );
}

/** The indicator scorecard, grouped. */
export function Scorecard({ indicators }: { indicators: CrashIndicator[] }) {
    const groups = ['Market', 'Credit & Rates', 'Speculation', 'Cycle & Macro'] as const;
    return (
        <div className="flex flex-col gap-4">
            {groups.map((g) => {
                const items = indicators.filter((i) => i.group === g);
                if (items.length === 0) return null;
                return (
                    <div key={g} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                        <h3 className="mb-3 text-sm font-semibold text-gray-100">{g}</h3>
                        <ul className="flex flex-col divide-y divide-gray-800/70">
                            {items.map((i) => (
                                <li key={i.key} className="flex items-start justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-gray-200">{i.label}</span>
                                            <span className={cn(
                                                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                                i.provenance === 'live' ? 'bg-teal-400/10 text-teal-300' : 'bg-gray-700/60 text-gray-400'
                                            )}>
                                                {i.provenance === 'live' ? 'Live' : 'Analyst read'}
                                            </span>
                                            {i.value && <span className="text-xs tabular-nums text-gray-500">{i.value}</span>}
                                        </div>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-400">{i.detail}</p>
                                    </div>
                                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', classChip(i.classification))}>
                                        {CLASS_LABEL[i.classification]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

/** The long-cycle clock. */
export function CycleClock({ cycles }: { cycles: CrashCyclePosition[] }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h3 className="text-base font-semibold text-gray-100">The cycle clock</h3>
            <p className="mb-4 mt-0.5 text-xs text-gray-500">
                Where the major historical cycles sit today, measured from their last dated anchor.
                Approximate by design — cycles rhyme, they don&apos;t repeat to the month.
            </p>
            <ul className="flex flex-col gap-4">
                {cycles.map((c) => {
                    const late = c.progressPct >= 70;
                    const mid = c.progressPct >= 45 && c.progressPct < 70;
                    const fill = late ? 'bg-red-400' : mid ? 'bg-amber-400' : 'bg-emerald-400';
                    return (
                        <li key={c.name}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <span className="text-sm font-medium text-gray-200">{c.name}</span>
                                <span className="text-[11px] text-gray-500">
                                    {c.period} · {c.ageYears.toFixed(1)} yrs since {c.anchorLabel}
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800">
                                    <div className={cn('h-full rounded-full', fill)} style={{ width: `${c.progressPct}%` }} />
                                </div>
                                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-400">{Math.round(c.progressPct)}%</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{c.note}</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** Historical analog comparison. */
export function HistoricalTable({ analogs, closest }: { analogs: HistoricalAnalog[]; closest: HistoricalAnalog }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h3 className="text-base font-semibold text-gray-100">How 2026 compares to past peaks</h3>
            <p className="mb-4 mt-0.5 text-xs text-gray-500">
                Closest analog by today&apos;s signal mix: <span className="font-semibold text-gray-300">{closest.year} — {closest.name}</span>.
                Similarity is an analyst read, not a prediction that it repeats.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2">Episode</th>
                            <th className="px-3 py-2 text-right">Drawdown</th>
                            <th className="px-3 py-2">Trigger</th>
                            <th className="px-3 py-2">What was extreme</th>
                            <th className="px-3 py-2 w-32">Similarity now</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analogs.map((a) => {
                            const isClosest = a.year === closest.year;
                            return (
                                <tr key={a.year} className={cn('border-b border-gray-800/60', isClosest && 'bg-amber-400/[0.04]')}>
                                    <td className="px-3 py-2.5">
                                        <span className="font-semibold text-gray-100">{a.year}</span>
                                        <span className="ml-1.5 text-xs text-gray-500">{a.name}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-red-400">{a.drawdown}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-400">{a.trigger}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-400">{a.setup}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800">
                                                <div className={cn('h-full rounded-full', isClosest ? 'bg-amber-400' : 'bg-gray-600')} style={{ width: `${a.similarity}%` }} />
                                            </div>
                                            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-gray-400">{a.similarity}</span>
                                        </div>
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

/** Scenario timeline (6 / 12 / 24 / 36 months). */
export function ScenarioTimeline({ scenarios }: { scenarios: CrashScenario[] }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h3 className="text-base font-semibold text-gray-100">Scenarios ahead</h3>
            <p className="mb-4 mt-0.5 text-xs text-gray-500">Base case vs. the risk case at each horizon.</p>
            <ol className="relative ml-2 flex flex-col gap-5 border-l border-gray-800 pl-5">
                {scenarios.map((s) => (
                    <li key={s.horizon} className="relative">
                        <span className="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-gray-950 bg-teal-400" />
                        <p className="text-sm font-semibold text-gray-100">{s.horizon}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-300">
                            <span className="font-medium text-emerald-400">Base: </span>{s.base}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-400">
                            <span className="font-medium text-red-400">Risk: </span>{s.risk}
                        </p>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/** The two balanced argument columns. */
export function ReasonsColumns({ no, under }: { no: string[]; under: string[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4 md:p-5">
                <h3 className="mb-3 text-base font-semibold text-emerald-400">Reasons a crash may NOT happen</h3>
                <ul className="flex flex-col gap-2.5">
                    {no.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-300">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                            {r}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.03] p-4 md:p-5">
                <h3 className="mb-3 text-base font-semibold text-red-400">Reasons investors may be underestimating risk</h3>
                <ul className="flex flex-col gap-2.5">
                    {under.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-300">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                            {r}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** Compact "what's driving it / what disagrees" strip. */
export function DriversStrip({ drivers, disagreements }: { drivers: CrashIndicator[]; disagreements: CrashIndicator[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-100">Biggest risk contributors</h3>
                {drivers.length === 0 ? (
                    <p className="text-xs text-gray-500">No indicator is flashing elevated risk right now.</p>
                ) : (
                    <ul className="flex flex-col gap-1.5">
                        {drivers.map((d) => (
                            <li key={d.key} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-gray-300">{d.label}</span>
                                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-medium', classChip(d.classification))}>{CLASS_LABEL[d.classification]}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-100">Signals that disagree</h3>
                {disagreements.length === 0 ? (
                    <p className="text-xs text-gray-500">The signals are broadly aligned right now.</p>
                ) : (
                    <ul className="flex flex-col gap-1.5">
                        {disagreements.map((d) => (
                            <li key={d.key} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-gray-300">{d.label}</span>
                                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-medium', classChip(d.classification))}>{CLASS_LABEL[d.classification]}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

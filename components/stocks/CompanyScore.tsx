'use client';

/**
 * FeedCast Company Score — proprietary multi-factor rating on the stock page.
 * Shows the 0–100 composite + grade, each of the five pillars as an expandable
 * bar that reveals the exact metric inputs that drove it, and a compact
 * methodology strip. Explainable by design: every number traces to its inputs.
 */

import { useState } from 'react';
import { Gem, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import type { CompanyScore as CompanyScoreData, ScorePillar } from '@/lib/actions/company-score.actions';

function toneFor(score: number | null): string {
    if (score === null) return 'text-gray-500';
    if (score >= 68) return 'text-emerald-400';
    if (score >= 54) return 'text-teal-300';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
}
function barFor(score: number | null): string {
    if (score === null) return 'bg-gray-700';
    if (score >= 68) return 'bg-emerald-400';
    if (score >= 54) return 'bg-teal-400';
    if (score >= 40) return 'bg-amber-400';
    return 'bg-red-400';
}
const fmt = (v: number | null, unit?: string) =>
    v === null || !Number.isFinite(v) ? 'n/a' : `${v.toFixed(unit === 'x' ? 2 : 1)}${unit === '%' ? '%' : unit === 'x' ? '×' : ''}`;

function PillarRow({ p }: { p: ScorePillar }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
                <span className="w-32 shrink-0 text-sm font-medium text-gray-200">{p.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                    <div className={cn('h-full rounded-full', barFor(p.score))} style={{ width: `${p.score ?? 0}%` }} />
                </div>
                <span className={cn('w-9 shrink-0 text-right text-sm font-bold tabular-nums', toneFor(p.score))}>
                    {p.score ?? '—'}
                </span>
                <ChevronDown size={14} className={cn('shrink-0 text-gray-500 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="border-t border-gray-800 px-3 py-2.5">
                    <ul className="flex flex-col gap-1.5">
                        {p.inputs.map((it) => (
                            <li key={it.label} className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-gray-400">{it.label}</span>
                                <span className="flex items-center gap-2">
                                    <span className="tabular-nums text-gray-300">{fmt(it.value, it.unit)}</span>
                                    <span className={cn('w-7 text-right font-semibold tabular-nums', toneFor(it.score))}>
                                        {it.score ?? '—'}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function CompanyScore({ data }: { data: CompanyScoreData }) {
    if (data.overall === null) return null;
    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Gem size={16} className="text-teal-400" /> FeedCast Company Score
                </h2>
                <div className="flex items-baseline gap-2">
                    <span className={cn('text-3xl font-bold tabular-nums', toneFor(data.overall))}>{data.overall}</span>
                    <span className="text-xs text-gray-500">/100 · {data.grade}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {data.pillars.map((p) => (
                    <PillarRow key={p.key} p={p} />
                ))}
            </div>

            <div className="mt-4">
                <ScoreMethodology
                    methodology="A 0–100 composite of five pillars — Quality (ROE, ROIC, margins), Growth (revenue & EPS YoY), Valuation (P/E, P/S, P/B, P/FCF, yield — cheaper scores higher), Momentum (52-week return & relative strength) and Financial Health (debt/equity, current ratio, interest coverage). Each metric maps to a 0–100 score on fixed thresholds; tap any pillar above to see the exact inputs."
                    cadence="Computed from the latest fundamentals on read and cached ~12h, so it moves as new quarterly figures and prices post."
                    thresholds="Composite: 82+ Exceptional · 68–81 Strong · 54–67 Average · 40–53 Weak · <40 Poor. Pillars are weighted Quality 28% · Health 20% · Growth 18% · Valuation 18% · Momentum 16%. A great company can still score low on Valuation when it is expensive — that is by design."
                />
            </div>
            <p className="mt-3 text-[11px] text-gray-600">
                Proprietary FeedCast rating from fundamental &amp; price data — educational only, not investment advice.
            </p>
        </section>
    );
}

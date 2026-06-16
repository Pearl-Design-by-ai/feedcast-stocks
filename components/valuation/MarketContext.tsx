/**
 * Whole-market valuation context for the Valuation Screen (server-safe).
 *
 * Section A — broad gauges (Shiller CAPE, Buffett Indicator, forward P/E) shown
 * as EXTERNALLY-SOURCED REFERENCE figures, explicitly not computed here.
 * Section B — cheap vs expensive sectors. Section C — the rotation read.
 */

import { ExternalLink, Info, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    MARKET_GAUGES,
    VERDICT_META,
    MARKET_VERDICT,
    CHEAP_SECTORS,
    RICH_SECTORS,
    ROTATION_NOTES,
    VALUATION_CONTEXT_SOURCES,
    type Verdict,
} from '@/lib/valuation-context';

const VERDICT_TEXT: Record<'pos' | 'neutral' | 'warn' | 'neg', string> = {
    pos: 'text-emerald-400',
    neutral: 'text-gray-300',
    warn: 'text-amber-400',
    neg: 'text-red-400',
};
const VERDICT_CHIP: Record<'pos' | 'neutral' | 'warn' | 'neg', string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    neutral: 'bg-gray-700/60 text-gray-300',
    warn: 'bg-amber-400/10 text-amber-400',
    neg: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-400/40',
};

function gaugeTone(v: Verdict) {
    return VERDICT_META[v].tone;
}

export default function MarketContext() {
    return (
        <section className="flex flex-col gap-4">
            {/* A — broad market gauges */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-100">Is the market cheap or expensive?</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-800/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        <Info size={11} /> Reference — externally sourced, not computed here
                    </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    These whole-market gauges can&apos;t be derived per-stock from free data, so we show the
                    published reference levels (approx., ~mid-2026) with links to the live source — for context
                    alongside the per-stock screen below.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {MARKET_GAUGES.map((g) => {
                        const tone = gaugeTone(g.verdict);
                        return (
                            <div key={g.name} className="flex flex-col rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-100">{g.name}</span>
                                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold', VERDICT_CHIP[tone])}>
                                        {VERDICT_META[g.verdict].label}
                                    </span>
                                </div>
                                <p className={cn('mt-1.5 text-2xl font-bold tabular-nums', VERDICT_TEXT[tone])}>{g.level}</p>
                                <p className="text-[11px] text-gray-500">{g.average}</p>
                                <p className="mt-2 text-[11px] leading-relaxed text-gray-400">{g.percentile}</p>
                                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{g.what}</p>
                                <a
                                    href={g.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline"
                                >
                                    {g.source.label}
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-3.5">
                    <p className="text-sm font-semibold text-amber-400">{MARKET_VERDICT.headline}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-300">{MARKET_VERDICT.body}</p>
                </div>
            </div>

            {/* B — cheap vs expensive sectors */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4 md:p-5">
                    <h3 className="mb-1 text-base font-semibold text-emerald-400">Where it looks cheap</h3>
                    <p className="mb-3 text-[11px] text-gray-500">Lower multiples, out-of-favor — relative value, mid-2026.</p>
                    <ul className="flex flex-col gap-2.5">
                        {CHEAP_SECTORS.map((s) => (
                            <li key={s.sector} className="flex gap-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                <div>
                                    <span className="text-sm font-medium text-gray-200">{s.sector}</span>
                                    <p className="text-[11px] leading-relaxed text-gray-400">{s.note}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.03] p-4 md:p-5">
                    <h3 className="mb-1 text-base font-semibold text-red-400">Where it looks expensive</h3>
                    <p className="mb-3 text-[11px] text-gray-500">Premium multiples, crowded — relative value, mid-2026.</p>
                    <ul className="flex flex-col gap-2.5">
                        {RICH_SECTORS.map((s) => (
                            <li key={s.sector} className="flex gap-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                                <div>
                                    <span className="text-sm font-medium text-gray-200">{s.sector}</span>
                                    <p className="text-[11px] leading-relaxed text-gray-400">{s.note}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* C — rotation read */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <ArrowLeftRight size={16} className="text-teal-400" /> Where could the rotation go next?
                </h2>
                <p className="mb-4 mt-0.5 text-xs text-gray-500">
                    Leadership read and the most likely next moves — including the small-cap (Russell 2000)
                    and Dow/value angles. Analyst commentary, mid-2026.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {ROTATION_NOTES.map((r) => {
                        const accent =
                            r.tone === 'now' ? 'text-amber-400'
                            : r.tone === 'pivot' ? 'text-teal-400'
                            : r.tone === 'small' ? 'text-emerald-400'
                            : 'text-blue-400';
                        return (
                            <div key={r.title} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                                <p className={cn('flex items-center gap-1.5 text-sm font-semibold', accent)}>
                                    <TrendingUp size={14} /> {r.title}
                                </p>
                                <p className="mt-1.5 text-xs leading-relaxed text-gray-300">{r.body}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Reference sources</p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {VALUATION_CONTEXT_SOURCES.map((s) => (
                            <li key={s.url}>
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline">
                                    {s.label}
                                    <ExternalLink size={10} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

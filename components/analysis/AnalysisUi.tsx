/**
 * Shared presentational pieces for the /analysis tool pages — server-safe
 * (no hooks). Each tool gets its accent from the AnalysisTool catalog entry.
 */

import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import type { AnalysisTool } from '@/lib/analysis';
import { cn } from '@/lib/utils';

export type Tone = 'pos' | 'neg' | 'warn' | 'neutral';

const TONE_TEXT: Record<Tone, string> = {
    pos: 'text-emerald-400',
    neg: 'text-red-400',
    warn: 'text-amber-400',
    neutral: 'text-gray-300',
};

const TONE_CHIP: Record<Tone, string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    neg: 'bg-red-400/10 text-red-400',
    warn: 'bg-amber-400/10 text-amber-400',
    neutral: 'bg-gray-700/60 text-gray-300',
};

export function ToolHeader({ tool }: { tool: AnalysisTool }) {
    return (
        <header className="flex flex-col gap-3">
            <Link
                href="/analysis"
                className="flex w-fit items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-teal-400"
            >
                <ArrowLeft size={13} />
                All tools
            </Link>
            <div className="flex flex-col gap-1">
                <span
                    className={cn(
                        'w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        tool.chip
                    )}
                >
                    {tool.code}
                </span>
                <h1 className="text-3xl font-bold text-gray-100">{tool.name}</h1>
                <p className="max-w-3xl text-sm text-gray-400">{tool.description}</p>
            </div>
            <DataDisclaimer className="w-fit" />
        </header>
    );
}

/**
 * Plain GET form (works without JS) + the member's watchlist as one-tap
 * chips. Tool pages read `?symbol=` from searchParams.
 */
export function SymbolPicker({
    actionPath,
    current,
    watchlist,
    accentText,
}: {
    actionPath: string;
    current?: string;
    watchlist: string[];
    accentText: string;
}) {
    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <form action={actionPath} method="get" className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                        type="text"
                        name="symbol"
                        defaultValue={current ?? ''}
                        placeholder="Type a ticker — e.g. AAPL, NVDA, SPY"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={12}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-400/60 focus:outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-teal-400 transition-colors hover:bg-gray-700"
                >
                    Analyze
                </button>
            </form>
            {watchlist.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">
                        From your watchlist:
                    </span>
                    {watchlist.slice(0, 12).map((sym) => (
                        <Link
                            key={sym}
                            href={`${actionPath}?symbol=${encodeURIComponent(sym)}`}
                            className={cn(
                                'rounded-full border border-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-800',
                                sym === current ? accentText : 'hover:text-gray-100'
                            )}
                        >
                            {sym}
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}

export function Section({
    title,
    subtitle,
    children,
    className,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5', className)}>
            <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-100">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

export function SignalBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
                TONE_CHIP[tone]
            )}
        >
            {children}
        </span>
    );
}

export function StatCard({
    label,
    value,
    sub,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    sub?: string;
    tone?: Tone;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
            <span className={cn('text-xl font-semibold tabular-nums', TONE_TEXT[tone])}>{value}</span>
            {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </div>
    );
}

/** One signal row: label, reading, pass/fail badge, one-line meaning. */
export function SignalRow({
    label,
    reading,
    tone,
    note,
}: {
    label: string;
    reading: string;
    tone: Tone;
    note: string;
}) {
    return (
        <div className="flex flex-col gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
                <SignalBadge tone={tone}>
                    {tone === 'pos' ? 'Bullish' : tone === 'neg' ? 'Bearish' : tone === 'warn' ? 'Mixed' : '—'}
                </SignalBadge>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-200">{reading}</span>
            <p className="text-xs leading-relaxed text-gray-400">{note}</p>
        </div>
    );
}

/** One-line conclusion strip. */
export function BottomLine({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5 rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm leading-relaxed text-gray-300">
            <span
                className={cn(
                    'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    TONE_CHIP[tone]
                )}
            >
                Verdict
            </span>
            <p className="min-w-0">{children}</p>
        </div>
    );
}

export function EmptyToolState({ name }: { name: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center text-sm text-gray-500">
            Type a ticker above (or tap one from your watchlist) and {name} will run on two years
            of daily data.
        </div>
    );
}

export function NoDataState({ symbol }: { symbol: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center text-sm text-gray-500">
            No usable price history found for “{symbol}”. Check the ticker — US-listed symbols work
            best (e.g. AAPL, NVDA, SPY).
        </div>
    );
}

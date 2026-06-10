// Shared presentational pieces for the /reports pages — server-safe (no
// hooks), styled to the app's dark card language. Each report page supplies
// its own accent via the ReportDef catalog entry.

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import type { ReportDef, ReportTone } from '@/lib/reports';
import { cn } from '@/lib/utils';

const TONE_TEXT: Record<ReportTone, string> = {
    pos: 'text-emerald-400',
    neg: 'text-red-400',
    warn: 'text-amber-400',
    neutral: 'text-gray-300',
};

const TONE_CHIP: Record<ReportTone, string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    neg: 'bg-red-400/10 text-red-400',
    warn: 'bg-amber-400/10 text-amber-400',
    neutral: 'bg-gray-700/60 text-gray-300',
};

export function toneForChange(changePercent: number, flipped = false): ReportTone {
    const v = flipped ? -changePercent : changePercent;
    if (v >= 0.15) return 'pos';
    if (v <= -0.15) return 'neg';
    return 'neutral';
}

export function fmtPct(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

export function fmtPrice(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReportHeader({ report, timestamp }: { report: ReportDef; timestamp: string }) {
    return (
        <header className="flex flex-col gap-3">
            <Link
                href="/reports"
                className="flex w-fit items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-teal-400"
            >
                <ArrowLeft size={13} />
                All reports
            </Link>
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            report.accentChip
                        )}
                    >
                        {report.code}
                    </span>
                    <span className="text-xs text-gray-500">{timestamp}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-100">{report.name}</h1>
                <p className="max-w-3xl text-sm text-gray-400">{report.description}</p>
            </div>
            <DataDisclaimer className="w-fit" />
        </header>
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

export function SignalBadge({ tone, children }: { tone: ReportTone; children: React.ReactNode }) {
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
    tone?: ReportTone;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
            <span className={cn('text-xl font-semibold', TONE_TEXT[tone])}>{value}</span>
            {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </div>
    );
}

/** One-line "so what" strip — every report ends its data sections with one. */
export function BottomLine({ tone, children }: { tone: ReportTone; children: React.ReactNode }) {
    return (
        <div
            className={cn(
                'flex items-start gap-2.5 rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm leading-relaxed text-gray-300'
            )}
        >
            <span
                className={cn(
                    'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    TONE_CHIP[tone]
                )}
            >
                Bottom line
            </span>
            <p className="min-w-0">{children}</p>
        </div>
    );
}

/** Compact quote line used inside report tables. */
export function ChangeCell({ changePercent }: { changePercent: number }) {
    return (
        <span className={cn('font-medium tabular-nums', TONE_TEXT[toneForChange(changePercent)])}>
            {fmtPct(changePercent)}
        </span>
    );
}

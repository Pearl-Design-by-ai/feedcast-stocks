import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import { REPORTS } from '@/lib/reports';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Reports',
    description:
        'Daily desk-style briefings generated live from market data — macro, index technicals, volatility regime and a health check of your watchlist.',
};

export default function ReportsPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Reports</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Four desk-style briefings, generated live the moment you open them — no
                        stale PDFs. Each report computes its own signals from current market data,
                        states a one-line verdict, and shows you exactly how it got there.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {REPORTS.map((report) => (
                    <div
                        key={report.slug}
                        className={cn(
                            'group flex flex-col rounded-xl border bg-gray-900/40 p-5 transition-colors hover:bg-gray-900/70',
                            report.accentBorder
                        )}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                    report.accentChip
                                )}
                            >
                                {report.code}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                <Zap size={11} className={report.accentText} />
                                Live · generated on open
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-100">{report.name}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-400">{report.tagline}</p>

                        <details className="mt-3 text-sm">
                            <summary
                                className={cn(
                                    'cursor-pointer select-none text-xs font-semibold',
                                    report.accentText
                                )}
                            >
                                How it works
                            </summary>
                            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs leading-relaxed text-gray-400">
                                {report.how.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </details>

                        <div className="mt-auto pt-4">
                            <Link
                                href={`/reports/${report.slug}`}
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
                                    report.accentText
                                )}
                            >
                                Open report
                                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

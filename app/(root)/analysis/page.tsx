import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Info, Zap } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import { ANALYSIS_TOOLS } from '@/lib/analysis';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Analysis Studio',
    description:
        'Live analysis tools — trend verdicts, swing plans, trailing stops, earnings setups and a daily opportunity scan, computed from real market data.',
};

export default function AnalysisPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Analysis Studio</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Five focused tools, one job each. Pick a card, give it a ticker (or
                        nothing at all for the scanner), and it runs live on real market data —
                        every number on screen is computed the moment you ask.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ANALYSIS_TOOLS.map((tool) => (
                    <div
                        key={tool.slug}
                        className={cn(
                            'group flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-5 transition-colors hover:bg-gray-900/70',
                            tool.border
                        )}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                    tool.chip
                                )}
                            >
                                {tool.code}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                <Zap size={11} className={tool.text} />
                                Live
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-100">{tool.name}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-400">{tool.tagline}</p>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
                            <details className="relative">
                                <summary
                                    className={cn(
                                        'flex cursor-pointer select-none items-center gap-1 text-xs font-semibold transition-colors',
                                        tool.text
                                    )}
                                >
                                    <Info size={12} />
                                    How it works?
                                </summary>
                                <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs leading-relaxed text-gray-400">
                                    {tool.how.map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </details>
                            <Link
                                href={`/analysis/${tool.slug}`}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold transition-colors',
                                    tool.text
                                )}
                            >
                                Open
                                <ArrowRight
                                    size={15}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

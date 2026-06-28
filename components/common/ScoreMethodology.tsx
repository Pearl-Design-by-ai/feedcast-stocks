'use client';

/**
 * Compact "auditable score" strip for scored pages — three one-click chips that
 * expand to plain-language detail: how the score is built (Methodology), how
 * often it refreshes (Update cadence), and what the numbers mean (Thresholds).
 *
 * Advanced users don't need a white paper on first load, but they do need a
 * one-click path from any output to its method. Drop this right under the hero
 * of every page that shows a numeric score, gauge or rating.
 */

import { useState } from 'react';
import { FlaskConical, RefreshCw, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScoreMethodologyProps {
    /** How the score / rating is computed, in plain language. */
    methodology: React.ReactNode;
    /** How often it updates (e.g. "Recomputed every trading day after the US close"). */
    cadence: React.ReactNode;
    /** What the numbers / bands mean (the threshold logic). */
    thresholds: React.ReactNode;
    className?: string;
}

type TabKey = 'method' | 'cadence' | 'thresholds';

const TABS: { key: TabKey; label: string; icon: typeof FlaskConical }[] = [
    { key: 'method', label: 'Methodology', icon: FlaskConical },
    { key: 'cadence', label: 'Update cadence', icon: RefreshCw },
    { key: 'thresholds', label: 'Thresholds', icon: SlidersHorizontal },
];

export default function ScoreMethodology({ methodology, cadence, thresholds, className }: ScoreMethodologyProps) {
    const [open, setOpen] = useState<TabKey | null>(null);
    const body: Record<TabKey, React.ReactNode> = { method: methodology, cadence, thresholds };

    return (
        <div className={cn('rounded-xl border border-gray-800 bg-gray-900/40', className)}>
            <div className="flex flex-wrap items-center gap-1.5 p-2">
                <span className="px-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    How this score works
                </span>
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = open === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setOpen(active ? null : key)}
                            aria-expanded={active}
                            className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                                active
                                    ? 'border-teal-400/40 bg-teal-500/10 text-teal-300'
                                    : 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-600 hover:text-gray-100'
                            )}
                        >
                            <Icon size={13} />
                            {label}
                            <ChevronDown size={12} className={cn('text-gray-500 transition-transform', active && 'rotate-180')} />
                        </button>
                    );
                })}
            </div>
            {open && (
                <div className="border-t border-gray-800 px-3.5 py-3 text-[13px] leading-relaxed text-gray-400 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {body[open]}
                </div>
            )}
        </div>
    );
}

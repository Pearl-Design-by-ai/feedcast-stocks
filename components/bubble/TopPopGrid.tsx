'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { PhaseChip } from '@/components/bubble/BubbleUi';
import type { AssetBubble } from '@/lib/bubble';

const INITIAL = 5;

/**
 * "Highest pop risk right now" grid. Shows the top 5 by default and lets the
 * reader expand to the full top 10 (and collapse back) — the scan already
 * provides up to 10.
 */
export function TopPopGrid({ assets }: { assets: AssetBubble[] }) {
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? assets : assets.slice(0, INITIAL);
    const extra = assets.length - INITIAL;

    return (
        <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {shown.map((a) => (
                    <Link
                        key={a.symbol}
                        href={`/stocks/${a.symbol}`}
                        className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 transition-colors hover:border-red-400/40"
                    >
                        <div className="flex items-baseline justify-between">
                            <span className="font-semibold text-gray-100">{a.symbol}</span>
                            <span className="text-sm font-bold tabular-nums text-red-400">{a.popRisk}</span>
                        </div>
                        <div className="mt-2"><PhaseChip phase={a.phase} /></div>
                    </Link>
                ))}
            </div>

            {extra > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/40 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-red-400/30 hover:text-gray-200"
                >
                    {expanded ? 'Show fewer' : `Show ${extra} more (top ${assets.length})`}
                    <ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
            )}
        </div>
    );
}

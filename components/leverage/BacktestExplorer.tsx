'use client';

/**
 * Client wrapper around the backtest section: lets the owner switch the window
 * (6M / YTD / 1Y / Max) without a full reload. The initial YTD result is
 * server-rendered and passed in; other windows are fetched on demand through the
 * server action (engine-cached) and memoized so re-selecting is instant.
 */

import { useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { getLeverageReport, type LevRange } from '@/lib/actions/leverage.actions';
import type { LeverageBacktest } from '@/lib/leverage';
import { cn } from '@/lib/utils';
import { BacktestSection } from './LeverageUi';

const RANGES: { key: LevRange; label: string }[] = [
    { key: '6m', label: '6M' },
    { key: 'ytd', label: 'YTD' },
    { key: '1y', label: '1Y' },
    { key: 'max', label: 'Max' },
];

export default function BacktestExplorer({ initial }: { initial: LeverageBacktest }) {
    const [range, setRange] = useState<LevRange>((initial.range as LevRange) ?? 'ytd');
    const [bt, setBt] = useState<LeverageBacktest | null>(initial);
    const [pending, startTransition] = useTransition();
    const cache = useRef<Record<string, LeverageBacktest | null>>({ [initial.range]: initial });

    function pick(r: LevRange) {
        if (r === range) return;
        setRange(r);
        const hit = cache.current[r];
        if (hit !== undefined) {
            setBt(hit);
            return;
        }
        startTransition(async () => {
            const res = await getLeverageReport(r);
            const next = res?.backtest ?? null;
            cache.current[r] = next;
            setBt(next);
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-1">
                {RANGES.map((r) => (
                    <button
                        key={r.key}
                        type="button"
                        onClick={() => pick(r.key)}
                        aria-pressed={range === r.key}
                        className={cn(
                            'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                            range === r.key ? 'bg-violet-500/20 text-violet-200 ring-1 ring-inset ring-violet-400/40' : 'text-gray-400 hover:text-gray-200',
                        )}
                    >
                        {r.label}
                    </button>
                ))}
                {pending && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-violet-400" />}
            </div>

            <div className={cn(pending && 'pointer-events-none opacity-60 transition-opacity')}>
                {bt ? (
                    <BacktestSection bt={bt} />
                ) : (
                    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        Backtest unavailable for this window.
                    </div>
                )}
            </div>
        </div>
    );
}

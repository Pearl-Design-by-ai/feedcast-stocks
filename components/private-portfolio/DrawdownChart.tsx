'use client';

/**
 * Leverage-variant paths with a "Değer / Zirveden düşüş" toggle. Defaults to
 * the underwater view (% below the running peak), computed from the series.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LineChart } from './charts';
import { monthToYear, underwater } from '@/lib/private-portfolio/math';
import { fmtNum, fmtPct, variantLabel } from '@/lib/private-portfolio/format';
import type { PlanDrawdown } from '@/lib/private-portfolio/types';

type View = 'drawdown' | 'value';
const VIEWS: { id: View; label: string }[] = [
    { id: 'value', label: 'Değer' },
    { id: 'drawdown', label: 'Zirveden düşüş' },
];

export default function DrawdownChart({ series }: { series: PlanDrawdown['series'] }) {
    const [view, setView] = useState<View>('drawdown');
    const lines = Object.entries(series).map(([k, pts]) => {
        const ys = view === 'drawdown' ? underwater(pts.map((p) => p.value)) : pts.map((p) => p.value);
        return { name: variantLabel(k), points: pts.map((p, i) => ({ x: monthToYear(p.month), y: ys[i] })) };
    });

    return (
        <div className="flex flex-col gap-3">
            <div role="group" aria-label="Grafik görünümü" className="inline-flex w-max rounded-lg border border-gray-700 p-0.5 text-xs">
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        aria-pressed={view === v.id}
                        onClick={() => setView(v.id)}
                        className={cn(
                            'rounded-md px-3 py-1 font-medium transition-colors',
                            view === v.id ? 'bg-teal-400/15 text-teal-400' : 'text-gray-400 hover:text-gray-200'
                        )}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
            <LineChart series={lines} format={view === 'drawdown' ? (n) => fmtPct(n, 0) : (n) => fmtNum(n, 0)} zeroLine={view === 'drawdown'} />
        </div>
    );
}

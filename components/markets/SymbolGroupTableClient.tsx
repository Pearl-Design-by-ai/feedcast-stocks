'use client';

import { useState } from 'react';
import Link from 'next/link';
import SymbolPeekSheet, { type PeekTarget } from '@/components/markets/SymbolPeekSheet';
import type { PeriodReturns } from '@/lib/returns-math';

const COLS: Array<{ key: keyof PeriodReturns; label: string }> = [
    { key: 'w1', label: '1W' },
    { key: 'm1', label: '1M' },
    { key: 'm3', label: '3M' },
    { key: 'ytd', label: 'YTD' },
    { key: 'y1', label: '1Y' },
];

function Cell({ v }: { v: number | null }) {
    if (v == null) return <span className="text-gray-600">—</span>;
    return (
        <span className={v >= 0 ? 'text-green-500' : 'text-red-500'}>
            {v >= 0 ? '+' : ''}
            {v.toFixed(1)}%
        </span>
    );
}

/**
 * Interactive half of the hub group table. Context-preserving navigation:
 * clicking a row opens the symbol as a peek sheet over the list (state and
 * scroll intact); the symbol link itself is the full-page path for readers
 * and crawlers.
 */
export default function SymbolGroupTableClient({
    rows,
    nameLabel,
}: {
    rows: Array<{ symbol: string; name: string; returns: PeriodReturns }>;
    nameLabel: string;
}) {
    const [peek, setPeek] = useState<PeekTarget | null>(null);
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
            <table className="w-full text-sm">
                <thead className="text-gray-400">
                    <tr className="border-b border-gray-800 text-left">
                        <th className="px-4 py-3 font-medium">Symbol</th>
                        <th className="px-4 py-3 font-medium">{nameLabel}</th>
                        {COLS.map((c) => (
                            <th key={c.key} className="px-4 py-3 text-right font-medium">
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.symbol}
                            onClick={() => setPeek(row)}
                            className="cursor-pointer border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40"
                        >
                            <td className="px-4 py-3">
                                <Link
                                    href={`/stocks/${row.symbol}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-semibold text-gray-100 tabular-nums hover:text-white hover:underline"
                                >
                                    {row.symbol}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-400">{row.name}</td>
                            {COLS.map((c) => (
                                <td key={c.key} className="px-4 py-3 text-right font-medium tabular-nums">
                                    <Cell v={row.returns[c.key]} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <SymbolPeekSheet peek={peek} onClose={() => setPeek(null)} />
        </div>
    );
}

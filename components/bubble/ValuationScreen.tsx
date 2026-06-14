'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValuationEntry, ValuationScreen } from '@/lib/valuation';

const fmt = (v: number | null, suffix = '') =>
    v == null ? '—' : `${v.toFixed(1)}${suffix}`;

function Table({ rows, peClass }: { rows: ValuationEntry[]; peClass: string }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2 text-right">P/E</th>
                        <th className="px-3 py-2 text-right">P/S</th>
                        <th className="px-3 py-2 text-right">Div yld</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={r.symbol} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                            <td className="px-3 py-2 tabular-nums text-gray-600">{i + 1}</td>
                            <td className="px-3 py-2">
                                <Link href={`/stocks/${r.symbol}`} className="font-semibold text-gray-100 hover:text-teal-400">
                                    {r.symbol}
                                </Link>
                            </td>
                            <td className={cn('px-3 py-2 text-right font-semibold tabular-nums', peClass)}>{fmt(r.pe)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{fmt(r.ps)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{fmt(r.dy, '%')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ValuationLists({ screen }: { screen: ValuationScreen | null }) {
    const [tab, setTab] = useState<'cheapest' | 'priciest'>('cheapest');

    if (!screen || (screen.cheapest.length === 0 && screen.priciest.length === 0)) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                Building this session&apos;s valuation screen — pulling P/E across ~190 large-caps.
                Check back shortly; it refills after each market close.
            </div>
        );
    }

    const rows = tab === 'cheapest' ? screen.cheapest : screen.priciest;
    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }).format(new Date(screen.asOf));

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab('cheapest')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'cheapest' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/40' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'
                    )}
                >
                    <ArrowDownWideNarrow size={15} /> Cheapest {screen.cheapest.length}
                </button>
                <button
                    type="button"
                    onClick={() => setTab('priciest')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'priciest' ? 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-400/40' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'
                    )}
                >
                    <ArrowUpWideNarrow size={15} /> Most expensive {screen.priciest.length}
                </button>
                <span className="ml-auto text-[11px] text-gray-500">
                    {screen.scanned}/{screen.universe} scored · {asOf} ET
                </span>
            </div>

            <Table rows={rows} peClass={tab === 'cheapest' ? 'text-emerald-400' : 'text-red-400'} />

            <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                Ranked by trailing P/E (lower = cheaper on earnings). {screen.noEarnings} names are
                excluded for having no positive trailing earnings. A low P/E isn&apos;t automatically a
                bargain — it can flag a value trap or a cyclical peak — and a high one can be a fast
                grower. Screen, not advice.
            </p>
        </div>
    );
}

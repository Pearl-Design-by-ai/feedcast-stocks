'use client';

/** One account's holdings, sortable by value (default), name or income. */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtDate, fmtNum, fmtPct, fmtUsd } from '@/lib/private-portfolio/format';
import type { Holding } from '@/lib/private-portfolio/types';

type SortKey = 'value' | 'name' | 'income';

export default function HoldingsTable({ holdings, totalUsd }: { holdings: Holding[]; totalUsd: number }) {
    const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'value', desc: true });

    const rows = useMemo(() => {
        const out = [...holdings];
        out.sort((a, b) => {
            const d =
                sort.key === 'name'
                    ? a.name.localeCompare(b.name, 'tr')
                    : sort.key === 'income'
                      ? (a.annualIncomeUsd ?? 0) - (b.annualIncomeUsd ?? 0)
                      : a.valueUsd - b.valueUsd;
            return sort.desc ? -d : d;
        });
        return out;
    }, [holdings, sort]);

    if (!holdings.length) return <p className="text-sm text-gray-500">Bu hesapta pozisyon yok.</p>;

    const header = (key: SortKey, label: string, className?: string) => {
        const on = sort.key === key;
        return (
            <th className={cn('px-2 py-2 font-medium', className)} aria-sort={on ? (sort.desc ? 'descending' : 'ascending') : undefined}>
                <button
                    type="button"
                    onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'name' }))}
                    className={cn('inline-flex items-center gap-1 hover:text-gray-200', on && 'text-gray-200')}
                >
                    {label}
                    {on && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                </button>
            </th>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                        {header('name', 'Varlık')}
                        <th className="px-2 py-2 font-medium">Grup</th>
                        <th className="px-2 py-2 font-medium">Kupon · Vade</th>
                        <th className="px-2 py-2 text-right font-medium">Nominal / Adet</th>
                        {header('value', 'Değer (USD)', 'text-right')}
                        <th className="px-2 py-2 text-right font-medium">Pay</th>
                        {header('income', 'Yıllık gelir', 'text-right')}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((h, i) => (
                        <tr key={`${h.name}-${i}`} className="border-b border-gray-800/60 last:border-0">
                            <td className="px-2 py-2">
                                <div className="text-gray-200">{h.name}</div>
                                <div className="text-[11px] text-gray-500">
                                    {[h.ticker, h.isin, h.ccy !== 'USD' ? h.ccy : null].filter(Boolean).join(' · ') || '—'}
                                </div>
                            </td>
                            <td className="px-2 py-2 text-gray-400">{h.group}</td>
                            <td className="px-2 py-2 text-gray-400 tabular-nums">
                                {h.couponPct != null || h.maturity ? `${fmtPct(h.couponPct, 2)} · ${fmtDate(h.maturity)}` : '—'}
                            </td>
                            <td className="px-2 py-2 text-right text-gray-400 tabular-nums">{fmtNum(h.nominal ?? h.units)}</td>
                            <td className="px-2 py-2 text-right text-gray-100 tabular-nums">{fmtUsd(h.valueUsd)}</td>
                            <td className="px-2 py-2 text-right text-gray-400 tabular-nums">
                                {totalUsd > 0 ? fmtPct((h.valueUsd / totalUsd) * 100) : '—'}
                            </td>
                            <td className="px-2 py-2 text-right text-gray-300 tabular-nums">{h.annualIncomeUsd ? fmtUsd(h.annualIncomeUsd) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import Link from 'next/link';
import { fetchDailyClosesMap } from '@/lib/actions/returns.actions';
import { computePeriodReturns, EMPTY_RETURNS, type PeriodReturns } from '@/lib/returns-math';

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
 * A group of symbols as a multi-period returns table — one batched closes
 * round-trip for the whole group, each row linking into the symbol's detail
 * page. Used by the ETF Hub and Stock Hub directories; stream via Suspense.
 * Rows fall back to em-dashes when the data seam is unreachable, so the
 * directory itself always renders.
 */
export default async function SymbolGroupTable({
    rows,
    nameLabel = 'Name',
}: {
    rows: Array<{ symbol: string; name: string }>;
    nameLabel?: string;
}) {
    const closes = await fetchDailyClosesMap(rows.map((r) => r.symbol));
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
                    {rows.map((row) => {
                        const r = closes.has(row.symbol)
                            ? computePeriodReturns(closes.get(row.symbol)!)
                            : EMPTY_RETURNS;
                        return (
                            <tr
                                key={row.symbol}
                                className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40"
                            >
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/stocks/${row.symbol}`}
                                        className="font-semibold text-gray-100 tabular-nums hover:text-white hover:underline"
                                    >
                                        {row.symbol}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-400">{row.name}</td>
                                {COLS.map((c) => (
                                    <td key={c.key} className="px-4 py-3 text-right font-medium tabular-nums">
                                        <Cell v={r[c.key]} />
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

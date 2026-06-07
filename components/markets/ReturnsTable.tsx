import { getReturns, type SymbolReturns } from '@/lib/actions/returns.actions';

const COLS: Array<{ key: keyof Omit<SymbolReturns, 'symbol'>; label: string }> = [
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
 * Multi-period returns table (Stooq EOD). Streamed via Suspense on the page;
 * renders nothing if the data source is unreachable (all values null).
 */
export default async function ReturnsTable({
    rows,
}: {
    rows: Array<{ symbol: string; label: string }>;
}) {
    const data = await getReturns(rows.map((r) => r.symbol));
    const hasData = data.some((d) => d.w1 != null || d.m1 != null || d.ytd != null || d.y1 != null);
    if (!hasData) return null;

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
            <table className="w-full text-sm">
                <thead className="text-gray-400">
                    <tr className="border-b border-gray-800 text-left">
                        <th className="px-4 py-3 font-medium">Market</th>
                        {COLS.map((c) => (
                            <th key={c.key} className="px-4 py-3 text-right font-medium">
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const d = data[i];
                        return (
                            <tr
                                key={row.symbol}
                                className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40"
                            >
                                <td className="px-4 py-3 text-gray-200">{row.label}</td>
                                {COLS.map((c) => (
                                    <td key={c.key} className="px-4 py-3 text-right font-medium">
                                        <Cell v={d?.[c.key] ?? null} />
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="px-4 py-2 text-[11px] text-gray-600">
                Total returns approximated from Stooq end-of-day prices.
            </p>
        </div>
    );
}

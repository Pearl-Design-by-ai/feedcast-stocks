'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { getWatchlistQuotes } from '@/lib/actions/finnhub.actions';
import { getPortfolioXray } from '@/lib/actions/deepseek.actions';
import { formatCurrency } from '@/lib/utils';

interface Position {
    symbol: string;
    quantity: number;
    cost: number; // average cost per share
}

const STORAGE_KEY = 'fc-portfolio';

function pnlColor(v: number | null) {
    if (v == null) return 'text-gray-400';
    return v >= 0 ? 'text-green-500' : 'text-red-500';
}

export default function Portfolio() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ symbol: '', quantity: '', cost: '' });
    const [xray, setXray] = useState<string[] | null>(null);
    const [xrayLoading, setXrayLoading] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setPositions(JSON.parse(raw));
        } catch {
            /* ignore */
        }
    }, []);

    const persist = (next: Position[]) => {
        setPositions(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    };

    const refresh = useCallback(async (symbols: string[]) => {
        if (!symbols.length) {
            setPrices({});
            return;
        }
        setLoading(true);
        try {
            const quotes = await getWatchlistQuotes(symbols);
            const map: Record<string, number> = {};
            quotes.forEach((q) => {
                map[q.symbol.toUpperCase()] = q.price;
            });
            setPrices(map);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh(positions.map((p) => p.symbol));
    }, [positions, refresh]);

    function addPosition(e: React.FormEvent) {
        e.preventDefault();
        const symbol = form.symbol.trim().toUpperCase();
        const quantity = parseFloat(form.quantity);
        const cost = parseFloat(form.cost);
        if (!symbol || !(quantity > 0) || !(cost >= 0)) return;

        const existing = positions.find((p) => p.symbol === symbol);
        let next: Position[];
        if (existing) {
            const totalQty = existing.quantity + quantity;
            const avg = (existing.quantity * existing.cost + quantity * cost) / totalQty;
            next = positions.map((p) => (p.symbol === symbol ? { symbol, quantity: totalQty, cost: avg } : p));
        } else {
            next = [...positions, { symbol, quantity, cost }];
        }
        persist(next);
        setForm({ symbol: '', quantity: '', cost: '' });
    }

    async function runXray() {
        const valued = positions
            .map((p) => ({ symbol: p.symbol, value: (prices[p.symbol] ?? 0) * p.quantity }))
            .filter((h) => h.value > 0);
        const total = valued.reduce((s, h) => s + h.value, 0);
        if (!valued.length || total <= 0) return;
        const holdings = valued.map((h) => ({ symbol: h.symbol, weight: (h.value / total) * 100 }));
        setXrayLoading(true);
        try {
            const res = await getPortfolioXray(holdings);
            setXray(res?.points ?? []);
        } finally {
            setXrayLoading(false);
        }
    }

    const rows = positions.map((p) => {
        const price = prices[p.symbol] ?? null;
        const value = price != null ? price * p.quantity : null;
        const costTotal = p.cost * p.quantity;
        const pl = value != null ? value - costTotal : null;
        const plPct = pl != null && costTotal > 0 ? (pl / costTotal) * 100 : null;
        return { ...p, price, value, costTotal, pl, plPct };
    });
    const totalCost = rows.reduce((s, r) => s + r.costTotal, 0);
    const totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0);
    const totalPl = totalValue - totalCost;
    const totalPlPct = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

    const inputCls =
        'h-11 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:outline-none';

    return (
        <div className="flex flex-col gap-6">
            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <p className="text-xs text-gray-500">Market Value</p>
                    <p className="text-2xl font-bold text-gray-100">{formatCurrency(totalValue)}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <p className="text-xs text-gray-500">Cost Basis</p>
                    <p className="text-2xl font-bold text-gray-100">{formatCurrency(totalCost)}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <p className="text-xs text-gray-500">Total P/L</p>
                    <p className={`text-2xl font-bold ${pnlColor(totalCost > 0 ? totalPl : null)}`}>
                        {formatCurrency(totalPl)}
                        {totalCost > 0 && (
                            <span className="ml-2 text-base font-semibold">
                                ({totalPlPct >= 0 ? '+' : ''}
                                {totalPlPct.toFixed(2)}%)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Add form */}
            <form onSubmit={addPosition} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                    className={inputCls}
                    placeholder="Symbol (e.g. AAPL)"
                    aria-label="Symbol"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                />
                <input
                    className={inputCls}
                    placeholder="Shares"
                    aria-label="Shares"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
                <input
                    className={inputCls}
                    placeholder="Avg cost / share"
                    aria-label="Average cost per share"
                    inputMode="decimal"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
                <button
                    type="submit"
                    className="h-11 rounded-lg bg-teal-500 px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-teal-400"
                >
                    Add
                </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                    <span className="text-xs text-gray-500">
                        Holdings are saved on this device only.
                    </span>
                    <button
                        type="button"
                        onClick={() => refresh(positions.map((p) => p.symbol))}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-400"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                {rows.length ? (
                    <table className="w-full text-sm">
                        <thead className="text-gray-400">
                            <tr className="border-b border-gray-800 text-left">
                                <th className="px-4 py-3 font-medium">Symbol</th>
                                <th className="px-4 py-3 text-right font-medium">Shares</th>
                                <th className="px-4 py-3 text-right font-medium">Avg cost</th>
                                <th className="px-4 py-3 text-right font-medium">Price</th>
                                <th className="px-4 py-3 text-right font-medium">Value</th>
                                <th className="px-4 py-3 text-right font-medium">P/L</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.symbol} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40">
                                    <td className="px-4 py-3 font-semibold text-gray-100">{r.symbol}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">{r.quantity}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(r.cost)}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">
                                        {r.price != null ? formatCurrency(r.price) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-100">
                                        {r.value != null ? formatCurrency(r.value) : '—'}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-medium ${pnlColor(r.pl)}`}>
                                        {r.pl != null ? (
                                            <>
                                                {r.pl >= 0 ? '+' : ''}
                                                {formatCurrency(r.pl)}
                                                {r.plPct != null && (
                                                    <span className="ml-1 text-xs">
                                                        ({r.plPct >= 0 ? '+' : ''}
                                                        {r.plPct.toFixed(1)}%)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            aria-label={`Remove ${r.symbol}`}
                                            onClick={() => persist(positions.filter((p) => p.symbol !== r.symbol))}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                        No holdings yet — add a position above to track its value and P/L.
                    </p>
                )}
            </div>

            {/* AI X-ray */}
            {rows.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                            <Sparkles className="h-4 w-4 text-teal-400" /> AI Portfolio X-ray
                        </h3>
                        <button
                            type="button"
                            onClick={runXray}
                            disabled={xrayLoading || totalValue <= 0}
                            className="inline-flex items-center gap-1.5 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/20 disabled:opacity-50"
                        >
                            {xrayLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {xrayLoading ? 'Analyzing…' : xray ? 'Re-run' : 'Run X-ray'}
                        </button>
                    </div>
                    {xray ? (
                        xray.length ? (
                            <ul className="flex flex-col gap-2">
                                {xray.map((p, i) => (
                                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/70" />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Couldn’t analyze right now — try again.</p>
                        )
                    ) : (
                        <p className="text-sm text-gray-500">
                            Get an AI risk read on your holdings — concentration, tilts and what could hurt them.
                        </p>
                    )}
                    {xray && xray.length > 0 && (
                        <p className="mt-3 text-[11px] text-gray-600">
                            AI-generated risk commentary — not investment advice.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

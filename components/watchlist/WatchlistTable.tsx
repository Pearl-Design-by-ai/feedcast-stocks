"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, Bell } from "lucide-react";
import CreateAlertModal from "./CreateAlertModal";
import WatchlistButton from "@/components/WatchlistButton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { removeSymbolFromGroup } from "@/lib/actions/watchlist-groups.actions";
import type { WatchlistStockData } from "@/lib/actions/finnhub.actions";

interface WatchlistTableProps {
    data: WatchlistStockData[];
    onRefresh?: () => void;
    /** When set, removal targets just this group; otherwise removes everywhere. */
    groupId?: number;
}

// How often to refresh live prices. Finnhub's free tier allows 60 calls/min,
// and we make one call per symbol, so 30s keeps a sizeable watchlist safe.
const POLL_INTERVAL_MS = 30_000;

/** Compact signed-% cell — green/red/neutral, dash when unknown. */
function PctCell({ value }: { value: number | null | undefined }) {
    if (value == null) return <span className="text-gray-600">—</span>;
    const cls = value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-400";
    return (
        <span className={`tabular-nums ${cls}`}>
            {value > 0 ? "+" : ""}
            {value.toFixed(1)}%
        </span>
    );
}


/** One stock as a phone-width card — same data and actions as the table row. */
function MobileCard({
    stock,
    onRefresh,
    onRemove,
}: {
    stock: WatchlistStockData;
    onRefresh?: () => void;
    onRemove: (symbol: string) => Promise<void>;
}) {
    const isPositive = stock.change >= 0;
    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/40 p-4">
            {/* Identity + price */}
            <div className="flex items-start justify-between gap-3">
                <Link href={`/stocks/${stock.symbol}`} className="flex min-w-0 items-center gap-3">
                    {stock.logo ? (
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/5 bg-white/10">
                            <Image src={stock.logo} alt={stock.symbol} fill className="object-contain p-1" />
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-xs font-bold text-white">
                            {stock.symbol[0]}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{stock.name}</p>
                        <p className="truncate text-[11px] text-gray-500">
                            <span className="font-mono text-gray-400">{stock.symbol}</span>
                            {stock.industry && <> · {stock.industry}</>}
                        </p>
                    </div>
                </Link>
                <div className="shrink-0 text-right">
                    <p className="text-base font-semibold tabular-nums text-white">
                        {stock.price != null ? formatCurrency(stock.price) : "—"}
                    </p>
                    {stock.price != null && (
                        <span
                            className={`mt-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                        >
                            {isPositive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Period returns */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                {([["1W", stock.w1], ["1M", stock.m1], ["YTD", stock.ytd]] as const).map(([label, v]) => (
                    <div key={label} className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
                        <p className="text-xs font-semibold"><PctCell value={v} /></p>
                    </div>
                ))}
            </div>

            {/* Context line */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 tabular-nums">
                {stock.offHigh52 != null && (
                    <span className={stock.offHigh52 > -3 ? "text-green-400" : stock.offHigh52 < -20 ? "text-red-400" : undefined}>
                        {stock.offHigh52.toFixed(1)}% vs 52W high
                    </span>
                )}
                {stock.above200 != null && (
                    <span className={stock.above200 ? "text-green-400" : "text-red-400"}>
                        {stock.above200 ? "▲ above 200d" : "▼ below 200d"}
                    </span>
                )}
                {stock.dayLow != null && stock.dayHigh != null && (
                    <span>Day {formatCurrency(stock.dayLow)}–{formatCurrency(stock.dayHigh)}</span>
                )}
                <span>
                    {stock.marketCap ? formatNumber(stock.marketCap) : "—"} · P/E{" "}
                    {stock.peRatio != null ? stock.peRatio.toFixed(1) : "—"}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-2.5">
                <CreateAlertModal
                    symbol={stock.symbol}
                    currentPrice={stock.price ?? 0}
                    companyName={stock.name}
                    onAlertCreated={onRefresh}
                >
                    <button
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
                        title="Add Alert"
                    >
                        <Bell className="h-3.5 w-3.5" /> Alert
                    </button>
                </CreateAlertModal>
                <WatchlistButton
                    symbol={stock.symbol}
                    company={stock.name}
                    isInWatchlist={true}
                    type="icon"
                    showTrashIcon={false}
                    onWatchlistChange={async (sym, added) => {
                        if (!added) await onRemove(sym);
                    }}
                />
            </div>
        </div>
    );
}

export default function WatchlistTable({ data, onRefresh, groupId }: WatchlistTableProps) {
    const [stocks, setStocks] = useState<WatchlistStockData[]>(data);
    // Keep the latest symbols available to the interval without re-subscribing.
    const symbolsRef = useRef<string[]>(data.map((s) => s.symbol));

    useEffect(() => {
        setStocks(data);
        symbolsRef.current = data.map((s) => s.symbol);
    }, [data]);

    useEffect(() => {
        symbolsRef.current = stocks.map((s) => s.symbol);
    }, [stocks]);

    // Keyed on membership (not just length) so swapping one symbol for another
    // re-subscribes immediately instead of polling the removed symbol once more.
    const symbolsKey = stocks.map((s) => s.symbol).join(",");

    useEffect(() => {
        if (!symbolsKey) return;

        const interval = setInterval(async () => {
            const symbols = symbolsRef.current;
            if (symbols.length === 0) return;
            try {
                const { getWatchlistQuotes } = await import("@/lib/actions/finnhub.actions");
                const fresh = await getWatchlistQuotes(symbols);
                if (!fresh || fresh.length === 0) return;
                const map = new Map(fresh.map((q) => [q.symbol, q]));
                setStocks((current) =>
                    current.map((existing) => {
                        const q = map.get(existing.symbol);
                        // A null price means the poll failed for this symbol —
                        // keep the last known values rather than blanking the row.
                        return q && q.price != null
                            ? { ...existing, price: q.price, change: q.change, changePercent: q.changePercent }
                            : existing;
                    })
                );
            } catch (err) {
                console.error("Failed to poll watchlist prices", err);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [symbolsKey]);

    if (stocks.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                <h3 className="text-xl font-medium text-gray-300 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks to track their performance and set alerts.</p>
            </div>
        );
    }

    const handleRemove = async (symbol: string) => {
        if (groupId != null) await removeSymbolFromGroup(groupId, symbol);
        else await removeFromWatchlist(symbol);
        setStocks((curr) => curr.filter((s) => s.symbol !== symbol));
        onRefresh?.();
    };

    return (
        <>
        {/* Mobile: stacked cards — the 10-column table can't work on a phone. */}
        <div className="flex flex-col gap-3 md:hidden">
            {stocks.map((stock) => (
                <MobileCard key={stock.symbol} stock={stock} onRefresh={onRefresh} onRemove={handleRemove} />
            ))}
        </div>

        {/* Desktop: full data table. */}
        <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur-md shadow-xl md:block">
            <table className="w-full min-w-[1080px] text-left text-sm border-collapse">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                    <tr>
                        <th className="px-5 py-4 font-semibold tracking-wide">Company</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">Symbol</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">Price</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">Today</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">1W</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">1M</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">YTD</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">52W / Trend</th>
                        <th className="px-4 py-4 font-semibold tracking-wide">Cap · P/E</th>
                        <th className="px-4 py-4 text-right font-semibold tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {stocks.map((stock) => {
                        const isPositive = stock.change >= 0;
                        return (
                            <tr key={stock.symbol} className="hover:bg-white/5 transition-colors group">
                                <td className="px-5 py-4">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        className="flex items-center space-x-4 group/link"
                                        title={`View ${stock.symbol} details`}
                                    >
                                        {stock.logo ? (
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-white/10 shadow-sm border border-white/5">
                                                <Image
                                                    src={stock.logo}
                                                    alt={stock.symbol}
                                                    fill
                                                    className="object-contain p-1.5"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/5">
                                                {stock.symbol[0]}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white text-base group-hover/link:text-teal-400 transition-colors">{stock.name}</span>
                                            {stock.industry && (
                                                <span className="text-xs text-gray-500">{stock.industry}</span>
                                            )}
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-300">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        className="bg-white/5 px-2.5 py-1 rounded-md text-xs font-mono border border-white/10 hover:border-teal-400/40 hover:text-teal-400 transition-colors"
                                        title={`View ${stock.symbol} details`}
                                    >
                                        {stock.symbol}
                                    </Link>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-white font-medium text-base tracking-tight tabular-nums">
                                        {stock.price != null ? formatCurrency(stock.price) : "—"}
                                    </div>
                                    {stock.dayLow != null && stock.dayHigh != null && (
                                        <div className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
                                            Day {formatCurrency(stock.dayLow)} – {formatCurrency(stock.dayHigh)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 font-medium">
                                    {stock.price != null ? (
                                        <div className={`flex items-center w-fit px-2 py-1 rounded-md ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                            {isPositive ? <ArrowUp className="w-3.5 h-3.5 mr-1.5" /> : <ArrowDown className="w-3.5 h-3.5 mr-1.5" />}
                                            {Math.abs(stock.changePercent).toFixed(2)}%
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium"><PctCell value={stock.w1} /></td>
                                <td className="px-4 py-4 text-sm font-medium"><PctCell value={stock.m1} /></td>
                                <td className="px-4 py-4 text-sm font-medium"><PctCell value={stock.ytd} /></td>
                                <td className="px-4 py-4">
                                    <div className="text-sm tabular-nums text-gray-300">
                                        {stock.offHigh52 != null ? (
                                            <span className={stock.offHigh52 > -3 ? "text-green-400" : stock.offHigh52 < -20 ? "text-red-400" : "text-gray-300"}>
                                                {stock.offHigh52.toFixed(1)}% vs high
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </div>
                                    {stock.above200 != null && (
                                        <span
                                            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${stock.above200 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                                            title="Last close vs the 200-day average"
                                        >
                                            {stock.above200 ? "▲ above 200d" : "▼ below 200d"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-gray-400 font-medium">
                                    <div>{stock.marketCap ? formatNumber(stock.marketCap) : "—"}</div>
                                    <div className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
                                        P/E {stock.peRatio != null ? stock.peRatio.toFixed(1) : "—"}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <CreateAlertModal
                                            symbol={stock.symbol}
                                            currentPrice={stock.price ?? 0}
                                            companyName={stock.name}
                                            onAlertCreated={onRefresh}
                                        >
                                            <button className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10" title="Add Alert">
                                                <Bell className="w-4.5 h-4.5" />
                                            </button>
                                        </CreateAlertModal>

                                        <div className="transform scale-95 hover:scale-100 transition-transform">
                                            <WatchlistButton
                                                symbol={stock.symbol}
                                                company={stock.name}
                                                isInWatchlist={true}
                                                type="icon"
                                                showTrashIcon={false}
                                                onWatchlistChange={async (sym, added) => {
                                                    if (!added) await handleRemove(sym);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        </>
    );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, Bell } from "lucide-react";
import CreateAlertModal from "./CreateAlertModal";
import WatchlistButton from "@/components/WatchlistButton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import type { WatchlistStockData } from "@/lib/actions/finnhub.actions";

interface WatchlistTableProps {
    data: WatchlistStockData[];
    onRefresh?: () => void;
}

// How often to refresh live prices. Finnhub's free tier allows 60 calls/min,
// and we make one call per symbol, so 30s keeps a sizeable watchlist safe.
const POLL_INTERVAL_MS = 30_000;

export default function WatchlistTable({ data, onRefresh }: WatchlistTableProps) {
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
        await removeFromWatchlist(symbol);
        setStocks((curr) => curr.filter((s) => s.symbol !== symbol));
        onRefresh?.();
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                    <tr>
                        <th className="px-6 py-4 font-semibold tracking-wide">Company</th>
                        <th className="px-6 py-4 font-semibold tracking-wide">Symbol</th>
                        <th className="px-6 py-4 font-semibold tracking-wide">Price</th>
                        <th className="px-6 py-4 font-semibold tracking-wide">Change</th>
                        <th className="px-6 py-4 font-semibold tracking-wide">Market Cap</th>
                        <th className="px-6 py-4 font-semibold tracking-wide">P/E</th>
                        <th className="px-6 py-4 text-right font-semibold tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {stocks.map((stock) => {
                        const isPositive = stock.change >= 0;
                        return (
                            <tr key={stock.symbol} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
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
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-300">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        className="bg-white/5 px-2.5 py-1 rounded-md text-xs font-mono border border-white/10 hover:border-teal-400/40 hover:text-teal-400 transition-colors"
                                        title={`View ${stock.symbol} details`}
                                    >
                                        {stock.symbol}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-white font-medium text-base tracking-tight">
                                    {stock.price != null ? formatCurrency(stock.price) : "—"}
                                </td>
                                <td className="px-6 py-4 font-medium">
                                    {stock.price != null ? (
                                        <div className={`flex items-center w-fit px-2 py-1 rounded-md ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                            {isPositive ? <ArrowUp className="w-3.5 h-3.5 mr-1.5" /> : <ArrowDown className="w-3.5 h-3.5 mr-1.5" />}
                                            {Math.abs(stock.changePercent).toFixed(2)}%
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {stock.marketCap ? formatNumber(stock.marketCap) : "—"}
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {stock.peRatio != null ? stock.peRatio.toFixed(2) : "—"}
                                </td>
                                <td className="px-6 py-4 text-right">
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
    );
}

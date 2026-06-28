"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, Bell, ChevronsUpDown } from "lucide-react";
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


/**
 * This list read as a one-share-of-each portfolio: how the whole basket is up
 * or down today. value-weighted by price — Σ(today's change) / Σ(prior close) —
 * matching "total current value". Recomputes off the live-polled rows, so the
 * % moves with the 30s price refresh. Skips names whose quote isn't available.
 */
function PortfolioSummary({ stocks }: { stocks: WatchlistStockData[] }) {
    const priced = stocks.filter((s) => s.price != null && s.prevClose != null);
    if (priced.length === 0) return null;

    const value = priced.reduce((sum, s) => sum + (s.price ?? 0), 0);
    const changeAbs = priced.reduce((sum, s) => sum + (s.change ?? 0), 0);
    const prevTotal = value - changeAbs;
    const changePct = prevTotal > 0 ? (changeAbs / prevTotal) * 100 : null;
    const up = changeAbs > 0;
    const flat = changeAbs === 0;
    const tone = flat ? 'text-gray-300' : up ? 'text-green-400' : 'text-red-400';

    // YTD on the same 1-share-each basis: back out each name's start-of-year
    // price from its YTD %, then compare basket totals. Only names with a YTD
    // figure count; note partial coverage so the number stays honest.
    const ytdable = priced.filter((s) => s.ytd != null && s.price != null);
    let ytdPct: number | null = null;
    if (ytdable.length > 0) {
        let cur = 0;
        let start = 0;
        for (const s of ytdable) {
            const p = s.price as number;
            const startPrice = p / (1 + (s.ytd as number) / 100);
            cur += p;
            start += startPrice;
        }
        ytdPct = start > 0 ? ((cur - start) / start) * 100 : null;
    }
    const ytdUp = (ytdPct ?? 0) > 0;
    const ytdFlat = (ytdPct ?? 0) === 0;
    const ytdTone = ytdFlat ? 'text-gray-300' : ytdUp ? 'text-green-400' : 'text-red-400';

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 px-4 py-3">
            <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Portfolio</span>
                <span className="text-[11px] text-gray-500">
                    {priced.length} {priced.length === 1 ? 'holding' : 'holdings'}, 1 share each
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 tabular-nums">
                <span className="text-sm text-gray-300">{formatCurrency(value)}</span>

                <span className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Today</span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${flat ? 'bg-white/5' : up ? 'bg-green-500/10' : 'bg-red-500/10'} ${tone}`}>
                        {!flat && (up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                        {up ? '+' : ''}{formatCurrency(changeAbs)}
                        {changePct != null && <span className="opacity-80">({up ? '+' : ''}{changePct.toFixed(2)}%)</span>}
                    </span>
                </span>

                {ytdPct != null && (
                    <span className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">YTD</span>
                        <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${ytdFlat ? 'bg-white/5' : ytdUp ? 'bg-green-500/10' : 'bg-red-500/10'} ${ytdTone}`}
                            title={ytdable.length < priced.length ? `${ytdable.length} of ${priced.length} holdings have YTD data` : undefined}
                        >
                            {!ytdFlat && (ytdUp ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                            {ytdUp ? '+' : ''}{ytdPct.toFixed(2)}%
                            {ytdable.length < priced.length && <span className="opacity-60">*</span>}
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

// --- Sorting -----------------------------------------------------------------

type SortKey =
    | "name"
    | "symbol"
    | "price"
    | "changePercent"
    | "w1"
    | "m1"
    | "ytd"
    | "offHigh52"
    | "marketCap";
type SortDir = "asc" | "desc";
type Sort = { key: SortKey; dir: SortDir };

// Pull out the comparable value for each sortable column. Returning null marks
// the row as "no data" so it always sinks to the bottom regardless of direction.
const SORT_ACCESSORS: Record<SortKey, (s: WatchlistStockData) => number | string | null> = {
    name: (s) => s.name?.toLowerCase() ?? "",
    symbol: (s) => s.symbol?.toLowerCase() ?? "",
    price: (s) => s.price,
    // A null price means no live quote — sort those with the other "no data" rows.
    changePercent: (s) => (s.price != null ? s.changePercent : null),
    w1: (s) => s.w1,
    m1: (s) => s.m1,
    ytd: (s) => s.ytd,
    offHigh52: (s) => s.offHigh52,
    marketCap: (s) => s.marketCap ?? null,
};

// Text columns read most naturally A→Z; numbers most naturally biggest-first.
const DEFAULT_DIR: Record<SortKey, SortDir> = {
    name: "asc",
    symbol: "asc",
    price: "desc",
    changePercent: "desc",
    w1: "desc",
    m1: "desc",
    ytd: "desc",
    offHigh52: "desc",
    marketCap: "desc",
};

function sortStocks(stocks: WatchlistStockData[], sort: Sort | null): WatchlistStockData[] {
    if (!sort) return stocks;
    const accessor = SORT_ACCESSORS[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...stocks].sort((a, b) => {
        const va = accessor(a);
        const vb = accessor(b);
        const aMissing = va == null;
        const bMissing = vb == null;
        if (aMissing && bMissing) return 0;
        if (aMissing) return 1; // missing data always last
        if (bMissing) return -1;
        if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
        return ((va as number) - (vb as number)) * dir;
    });
}

/** Header label that toggles sorting for its column. */
function SortHeader({
    label,
    sortKey,
    sort,
    onSort,
    className = "",
    align = "left",
}: {
    label: React.ReactNode;
    sortKey: SortKey;
    sort: Sort | null;
    onSort: (key: SortKey) => void;
    className?: string;
    align?: "left" | "right";
}) {
    const active = sort?.key === sortKey;
    return (
        <th className={`font-semibold tracking-wide ${align === "right" ? "text-right" : ""} ${className}`}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                className={`inline-flex items-center gap-1 transition-colors hover:text-white ${
                    align === "right" ? "flex-row-reverse" : ""
                } ${active ? "text-white" : ""}`}
                title={`Sort by ${typeof label === "string" ? label : sortKey}`}
            >
                <span>{label}</span>
                {active ? (
                    sort!.dir === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-teal-400" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-teal-400" />
                    )
                ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5 text-gray-600" />
                )}
            </button>
        </th>
    );
}

/** Options offered by the mobile sort dropdown, in display order. */
const MOBILE_SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name", label: "Company" },
    { key: "symbol", label: "Symbol" },
    { key: "price", label: "Price" },
    { key: "changePercent", label: "Today" },
    { key: "w1", label: "1W" },
    { key: "m1", label: "1M" },
    { key: "ytd", label: "YTD" },
    { key: "offHigh52", label: "52W high" },
    { key: "marketCap", label: "Market cap" },
];

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

    // null = natural order (as the server returned it). Clicking a header sets a
    // column; clicking the active one again flips direction.
    const [sort, setSort] = useState<Sort | null>(null);
    const toggleSort = (key: SortKey) =>
        setSort((curr) =>
            curr?.key === key
                ? { key, dir: curr.dir === "asc" ? "desc" : "asc" }
                : { key, dir: DEFAULT_DIR[key] }
        );
    const sortedStocks = useMemo(() => sortStocks(stocks, sort), [stocks, sort]);

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
        <PortfolioSummary stocks={stocks} />

        {/* Mobile: stacked cards — the 10-column table can't work on a phone. */}
        <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center gap-2">
                <label htmlFor="watchlist-sort" className="text-xs font-medium text-gray-400">
                    Sort
                </label>
                <select
                    id="watchlist-sort"
                    value={sort?.key ?? ""}
                    onChange={(e) =>
                        setSort(e.target.value ? { key: e.target.value as SortKey, dir: DEFAULT_DIR[e.target.value as SortKey] } : null)
                    }
                    className="flex-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-gray-200 focus:border-teal-400/40 focus:outline-none"
                >
                    <option value="">Default order</option>
                    {MOBILE_SORT_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                            {o.label}
                        </option>
                    ))}
                </select>
                {sort && (
                    <button
                        type="button"
                        onClick={() => setSort({ key: sort.key, dir: sort.dir === "asc" ? "desc" : "asc" })}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-gray-200 transition-colors hover:text-white"
                        title={sort.dir === "asc" ? "Ascending" : "Descending"}
                    >
                        {sort.dir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {sortedStocks.map((stock) => (
                <MobileCard key={stock.symbol} stock={stock} onRefresh={onRefresh} onRemove={handleRemove} />
            ))}
        </div>

        {/* Desktop: full data table. */}
        <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur-md shadow-xl md:block">
            <table className="w-full min-w-[1080px] text-left text-sm border-collapse">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                    <tr>
                        <SortHeader label="Company" sortKey="name" sort={sort} onSort={toggleSort} className="px-5 py-4" />
                        <SortHeader label="Symbol" sortKey="symbol" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="Price" sortKey="price" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="Today" sortKey="changePercent" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="1W" sortKey="w1" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="1M" sortKey="m1" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="YTD" sortKey="ytd" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="52W / Trend" sortKey="offHigh52" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <SortHeader label="Cap · P/E" sortKey="marketCap" sort={sort} onSort={toggleSort} className="px-4 py-4" />
                        <th className="px-4 py-4 text-right font-semibold tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {sortedStocks.map((stock) => {
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

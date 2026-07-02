"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    const handleSearch = async () => {
        if(!isSearchMode) return setStocks(initialStocks);

        setLoading(true)
        try {
            const results = await searchStocks(searchTerm.trim());
            setStocks(results);
        } catch {
            setStocks([])
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        debouncedSearch();
    }, [debouncedSearch, searchTerm]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks);
    }

    return (
        <>
            {renderAs === 'text' ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="search-text group inline-flex items-center gap-2"
                >
                    {label}
                    <kbd className="hidden items-center gap-0.5 rounded border border-gray-600 bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 transition-colors group-hover:text-gray-300 md:inline-flex">
                        ⌘K
                    </kbd>
                </button>
            ): (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                    <kbd className="ml-1 hidden items-center rounded border border-gray-950/30 px-1 font-mono text-[10px] opacity-70 md:inline-flex">⌘K</kbd>
                </Button>
            )}
            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
                    {loading && <Loader2 className="search-loader" />}
                </div>
                <CommandList className="search-list">
                    {/* Quick jumps — the tools people reach for most, one keystroke away. */}
                    {!isSearchMode && !loading && (
                        <div className="flex flex-wrap gap-1.5 border-b border-gray-800 px-4 py-2.5">
                            {[
                                { href: '/buy-sell-signals', label: 'Buy & Sell Signals' },
                                { href: '/market-regime', label: 'Market Regime' },
                                { href: '/ask', label: 'Ask AI' },
                                { href: '/screener', label: 'Screener' },
                                { href: '/watchlist', label: 'Watchlist' },
                            ].map((q) => (
                                <Link
                                    key={q.href}
                                    href={q.href}
                                    onClick={() => setOpen(false)}
                                    className="rounded-full border border-gray-700 px-2.5 py-1 text-[11px] text-gray-400 transition-colors hover:border-teal-400 hover:text-gray-200"
                                >
                                    {q.label}
                                </Link>
                            ))}
                        </div>
                    )}
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count">
                                {isSearchMode ? 'Search results' : 'Popular stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock) => (
                                <li key={stock.symbol} className="search-item">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        onClick={handleSelectStock}
                                        className="search-item-link"
                                    >
                                        <TrendingUp className="h-4 w-4 text-gray-500" />
                                        <div  className="flex-1">
                                            <div className="search-item-name">
                                                {stock.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {[stock.symbol, stock.exchange, stock.type].filter(Boolean).join(' | ')}
                                            </div>
                                        </div>

                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )
                    }
                </CommandList>
            </CommandDialog>
        </>
    )
}

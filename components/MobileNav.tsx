'use client';

import { Menu, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, MARKETS_NAV } from "@/lib/constants";
import SearchCommand from "@/components/SearchCommand";

const FEEDCAST_HOME = "https://www.feedcast.news/";
const ROW = "flex items-center rounded-md px-3 py-2.5 text-[15px] text-gray-200 transition-colors hover:bg-gray-700/70 hover:text-teal-400";

/**
 * Primary navigation menu (all viewports): a left-opening hamburger panel,
 * styled to match the Feedcast Markets menu — a "Back to Feedcast" link at the
 * top, the main pages, then a "Markets" section.
 */
const MobileNav = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label="Open navigation menu"
                    className="size-9 bg-gray-800 hover:bg-gray-700 text-gray-400"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="w-60 rounded-xl border-gray-700 bg-gray-800 p-2 text-gray-200 shadow-xl"
            >
                {/* Back to Feedcast */}
                <a href={FEEDCAST_HOME} className={`${ROW} text-gray-400`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Feedcast
                </a>

                <div className="my-2 h-px bg-gray-700" />

                {/* Main pages */}
                {NAV_ITEMS.map(({ href, label }) => {
                    if (href === '/search') return (
                        <div key="search-trigger" className={ROW}>
                            <SearchCommand
                                renderAs="text"
                                label="Search"
                                initialStocks={initialStocks}
                            />
                        </div>
                    )
                    return (
                        <Link key={href} href={href} className={ROW}>
                            {label}
                        </Link>
                    )
                })}

                {/* Markets section */}
                <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {MARKETS_NAV.label}
                </div>
                {MARKETS_NAV.items.map(({ href, label }) => (
                    <Link key={href} href={href} className={ROW}>
                        {label}
                    </Link>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default MobileNav;

'use client';

import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, MARKETS_NAV } from "@/lib/constants";
import SearchCommand from "@/components/SearchCommand";

/**
 * Mobile-only hamburger menu holding the content navigation. The market pages
 * are listed flat under a "Markets" heading (instead of a nested dropdown).
 * On sm+ the inline header nav is used, so the trigger is hidden there.
 */
const MobileNav = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label="Open navigation menu"
                    className="sm:hidden size-9 bg-gray-800 hover:bg-gray-700 text-gray-400"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48 p-3 text-gray-400 bg-gray-800">
                <ul className="flex flex-col gap-3 font-medium">
                    <li>
                        <a
                            href="https://www.feedcast.news"
                            className="flex items-center gap-2 text-gray-500 hover:text-teal-400 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Feedcast
                        </a>
                    </li>
                    <li className="border-t border-gray-700 pt-1" aria-hidden="true" />
                    {NAV_ITEMS.map(({ href, label }) => {
                        if (href === '/search') return (
                            <li key="search-trigger">
                                <SearchCommand
                                    renderAs="text"
                                    label="Search"
                                    initialStocks={initialStocks}
                                />
                            </li>
                        )
                        return (
                            <li key={href}>
                                <Link href={href} className="hover:text-teal-500 transition-colors">
                                    {label}
                                </Link>
                            </li>
                        )
                    })}

                    <li className="mt-1 border-t border-gray-700 pt-3 text-xs uppercase tracking-wide text-gray-500">
                        {MARKETS_NAV.label}
                    </li>
                    {MARKETS_NAV.items.map(({ href, label }) => (
                        <li key={href}>
                            <Link href={href} className="hover:text-teal-500 transition-colors">
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default MobileNav;

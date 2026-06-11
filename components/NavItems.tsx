'use client'

import React from 'react'
import {NAV_ITEMS, MARKETS_NAV} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {ChevronDown} from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavItems = ({initialStocks}: { initialStocks: StockWithWatchlistStatus[]}) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path ==='/') return pathname === '/'

        return  pathname.startsWith(path);
    }

    const marketsActive = MARKETS_NAV.items.some((item) => pathname.startsWith(item.href))

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({href, label}) => {
                if (href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                )
                return <li key={href}>
                    <Link href={href} className={`hover:text-teal-500 transition-colors ${isActive(href) ? 'text-gray-100' : ''}`}>
                        {label}
                    </Link>
                </li>
            })}

            <li key="markets">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={`flex items-center gap-1 outline-none hover:text-teal-500 transition-colors ${marketsActive ? 'text-gray-100' : ''}`}
                    >
                        {MARKETS_NAV.label}
                        <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-gray-400 bg-gray-800">
                        {MARKETS_NAV.items.map(({href, label}) => (
                            <DropdownMenuItem
                                key={href}
                                asChild
                                className="cursor-pointer focus:bg-gray-700 focus:text-teal-500"
                            >
                                <Link href={href} className={isActive(href) ? 'text-gray-100' : ''}>
                                    {label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </li>
        </ul>
    )
}
export default NavItems

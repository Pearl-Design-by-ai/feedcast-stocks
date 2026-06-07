'use client';

import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import NavItems from "@/components/NavItems";

/**
 * Mobile-only hamburger menu holding the content navigation (Dashboard, Search,
 * Watchlist, Indicators). On sm+ the inline nav in the header is used instead,
 * so the trigger is hidden there. Keeps the account dropdown to user + Logout.
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
            <DropdownMenuContent align="start" className="text-gray-400 bg-gray-800">
                <NavItems initialStocks={initialStocks} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default MobileNav;

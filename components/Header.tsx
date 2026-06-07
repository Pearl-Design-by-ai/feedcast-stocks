import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import UserDropdown from "@/components/UserDropdown";
import MobileNav from "@/components/MobileNav";
import { FeedcastLogo } from "@/components/FeedcastLogo";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {/* Return to the parent Feedcast app — Markets is a companion module. */}
                    <a
                        href="https://www.feedcast.news"
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-400 transition-colors shrink-0"
                        title="Back to Feedcast"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Feedcast</span>
                    </a>
                    <span className="hidden sm:block h-5 w-px bg-gray-600" aria-hidden="true" />
                    <Link href="/" className="flex items-center justify-center gap-2 min-w-0">
                        <FeedcastLogo size={32} className="text-teal-400" />
                        <span className="text-lg sm:text-xl font-semibold text-gray-100 truncate">FeedCast <span className="text-teal-400">Markets</span></span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search lives in the header (like Feedcast); the section nav
                        moved to the left rail. On mobile it's reachable from the
                        hamburger menu, so hide the header button there. */}
                    <div className="hidden sm:block">
                        <SearchCommand renderAs="button" label="Search" initialStocks={initialStocks} />
                    </div>
                    <MobileNav initialStocks={initialStocks} />
                    <UserDropdown user={user} />
                </div>
            </div>
        </header>
    )
}
export default Header

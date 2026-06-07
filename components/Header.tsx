import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import MobileNav from "@/components/MobileNav";
import { FeedcastLogo } from "@/components/FeedcastLogo";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
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
                        <FeedcastLogo size={34} className="text-teal-400" />
                        <span className="text-xl font-semibold text-gray-100 truncate">FeedCast <span className="text-teal-400">Markets</span></span>
                    </Link>
                </div>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks}/>
                </nav>

                <div className="flex items-center gap-2">
                    <MobileNav initialStocks={initialStocks} />
                    <UserDropdown user={user} />
                </div>
            </div>
        </header>
    )
}
export default Header

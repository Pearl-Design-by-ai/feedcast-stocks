import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";
import MobileNav from "@/components/MobileNav";
import { FeedcastLogo } from "@/components/FeedcastLogo";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <div className="flex items-center gap-3">
                    {/* Desktop: menu on the left, next to the logo */}
                    <div className="hidden sm:block">
                        <MobileNav initialStocks={initialStocks} />
                    </div>
                    <Link href="/" className="flex items-center justify-center gap-2">
                        <FeedcastLogo size={34} className="text-teal-400" />
                        <span className="text-xl font-semibold text-gray-100">FeedCast <span className="text-teal-400">Stocks</span></span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mobile: menu on the right, next to the avatar */}
                    <div className="sm:hidden">
                        <MobileNav initialStocks={initialStocks} />
                    </div>
                    <UserDropdown user={user} />
                </div>
            </div>
        </header>
    )
}
export default Header

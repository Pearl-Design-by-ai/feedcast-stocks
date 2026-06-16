import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";
import MobileDrawer from "@/components/MobileDrawer";
import { FeedcastLogo } from "@/components/FeedcastLogo";

const Header = ({ user, initialStocks, isPowerUser = false }: { user: User; initialStocks: StockWithWatchlistStatus[]; isPowerUser?: boolean }) => {
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <div className="flex items-center gap-3">
                    {/* Below md: tapping the logo opens the slide-in drawer
                        (matching the main feedcast.news app). md+ uses the
                        SideNav rail, so the logo is a plain home link there. */}
                    <div className="md:hidden">
                        <MobileDrawer user={user} initialStocks={initialStocks} isPowerUser={isPowerUser} />
                    </div>
                    <Link href="/" className="hidden md:flex items-center justify-center gap-2">
                        <FeedcastLogo size={34} className="text-teal-400" />
                        <span className="text-xl font-semibold text-gray-100">FeedCast <span className="text-teal-400">Markets</span></span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <UserDropdown user={user} />
                </div>
            </div>
        </header>
    )
}
export default Header

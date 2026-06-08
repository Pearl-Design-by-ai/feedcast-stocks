import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";
import MobileNav from "@/components/MobileNav";
import { FeedcastLogo } from "@/components/FeedcastLogo";

const Header = ({ user, initialStocks }: { user: User; initialStocks: StockWithWatchlistStatus[] }) => {
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <div className="flex items-center gap-3">
                    {/* Tablet (sm–md): hamburger drawer. md+ uses the SideNav rail
                        instead, so the drawer is hidden there to avoid duplicate nav. */}
                    <div className="hidden sm:block md:hidden">
                        <MobileNav initialStocks={initialStocks} />
                    </div>
                    <Link href="/" className="flex items-center justify-center gap-2">
                        <FeedcastLogo size={34} className="text-teal-400" />
                        <span className="text-xl font-semibold text-gray-100">FeedCast <span className="text-teal-400">Markets</span></span>
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

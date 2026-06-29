import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";
import MobileDrawer from "@/components/MobileDrawer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FeedcastLogo } from "@/components/FeedcastLogo";
import { SIGN_IN_URL } from "@/lib/constants";

const Header = ({ user, initialStocks, isPowerUser = false }: { user: User | null; initialStocks: StockWithWatchlistStatus[]; isPowerUser?: boolean }) => {
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
                    <LanguageSelector />
                    {user ? (
                        <UserDropdown user={user} />
                    ) : (
                        <a
                            href={SIGN_IN_URL}
                            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-teal-950 transition-colors hover:bg-teal-400"
                        >
                            Sign in
                        </a>
                    )}
                </div>
            </div>
        </header>
    )
}
export default Header

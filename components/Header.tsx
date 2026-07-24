import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserDropdown from "@/components/UserDropdown";
import MobileDrawer from "@/components/MobileDrawer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FeedcastLogo } from "@/components/FeedcastLogo";
import { SIGN_IN_URL, FEEDCAST_HOME } from "@/lib/constants";

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
                    {/* Way back to the main app. Markets is a separate origin, so
                        a reader who lands here from search has no Back button to
                        use — this is the only exit that's visible signed-out too
                        (the rail and drawer versions sit behind a menu). */}
                    <a
                        href={FEEDCAST_HOME}
                        aria-label="Back to FeedCast News"
                        title="Back to FeedCast News"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-400 transition-[color,transform] duration-150 ease-out hover:text-teal-400 active:scale-[0.97]"
                    >
                        <ArrowLeft size={16} className="shrink-0" />
                        <span className="hidden sm:inline">News</span>
                    </a>
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

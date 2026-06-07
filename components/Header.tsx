import Link from "next/link";
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
                <Link href="/" className="flex items-center justify-center gap-2">
                    <FeedcastLogo size={34} className="text-teal-400" />
                    <span className="text-xl font-semibold text-gray-100">FeedCast <span className="text-teal-400">Stocks</span></span>
                </Link>
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

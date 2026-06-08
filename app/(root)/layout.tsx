import type { CSSProperties } from "react";
import Header from "@/components/Header";
import { redirect } from "next/navigation";
import HomeOnlyFooter from "@/components/HomeOnlyFooter";
import SideNav from "@/components/SideNav";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { accentHex } from "@/lib/accent";

// Auth is handled by the main Feedcast app (SSO). Unauthenticated users
// are bounced to the Feedcast sign-in.
const SIGN_IN_URL = 'https://www.feedcast.news/?signin=stocks';

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect(SIGN_IN_URL);

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const sessionUser = {
        id: user.id,
        name:
            (meta.full_name as string) ||
            (meta.name as string) ||
            user.email?.split('@')[0] ||
            'Investor',
        email: user.email ?? '',
    };

    // Pull the member's accent color (chosen on www.feedcast.news, synced to
    // user_preferences.reading_preferences) and apply it to --brand so the whole
    // Markets UI is tinted with the same accent. RLS scopes the read to the
    // logged-in user; falls back to the main app's default accent (gold).
    const accentPromise = (async (): Promise<string | undefined> => {
        try {
            const { data } = await supabase
                .from('user_preferences')
                .select('reading_preferences')
                .eq('id', user.id)
                .maybeSingle();
            const prefs = data?.reading_preferences as { accentColor?: string } | null;
            return prefs?.accentColor;
        } catch {
            // Non-fatal — keep the default accent.
            return undefined;
        }
    })();

    // The accent read and the stock list are independent — fetch in parallel to
    // avoid a request waterfall. initialStocks is shared by the Header drawer and
    // the SideNav rail; searchStocks() is wrapped in React cache(), so it's a
    // single upstream call per request even though Header also calls it.
    const [accentColorId, initialStocks] = await Promise.all([
        accentPromise,
        searchStocks(),
    ]);

    const brand = accentHex(accentColorId);
    const brandStyle = { '--brand': brand, '--brand-hover': `${brand}CC` } as CSSProperties;

    return (
        <main style={brandStyle} className="min-h-screen text-gray-400">
            <Header user={sessionUser} initialStocks={initialStocks} />

            {/* Centered app shell — sidebar + content read as one centered block
                on wide screens, mirroring the main Feedcast layout. */}
            <div className="mx-auto w-full max-w-[1660px] px-4 md:px-6 lg:px-8">
                <div className="flex md:gap-6">
                    <SideNav initialStocks={initialStocks} />
                    <div className="min-w-0 flex-1">
                        <div className="mx-auto w-full max-w-[1400px] py-8 md:py-10">
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            <HomeOnlyFooter />
        </main>
    )
}
export default Layout

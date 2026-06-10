import Header from "@/components/Header";
import { redirect } from "next/navigation";
import HomeOnlyFooter from "@/components/HomeOnlyFooter";
import SideNav from "@/components/SideNav";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { accentHex } from "@/lib/accent";
import { backgroundTone } from "@/lib/appearance";

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

    // Pull the member's appearance picks (accent chosen on www.feedcast.news
    // or on /appearance here; background tone chosen on /appearance) from
    // user_preferences.reading_preferences. RLS scopes the read to the
    // logged-in user; falls back to the defaults (gold accent, Obsidian tone).
    const prefsPromise = (async (): Promise<{ accentColor?: string; marketsBackground?: string }> => {
        try {
            const { data } = await supabase
                .from('user_preferences')
                .select('reading_preferences')
                .eq('id', user.id)
                .maybeSingle();
            return (data?.reading_preferences as {
                accentColor?: string;
                marketsBackground?: string;
            } | null) ?? {};
        } catch {
            // Non-fatal — keep the defaults.
            return {};
        }
    })();

    // The accent read and the stock list are independent — fetch in parallel to
    // avoid a request waterfall. initialStocks is shared by the Header drawer and
    // the SideNav rail; searchStocks() is wrapped in React cache(), so it's a
    // single upstream call per request even though Header also calls it.
    const [prefs, initialStocks] = await Promise.all([
        prefsPromise,
        searchStocks(),
    ]);

    const brand = accentHex(prefs.accentColor);
    const tone = backgroundTone(prefs.marketsBackground);

    // Injected as a :root override (rather than inline on <main>) so portaled
    // UI — dropdowns, dialogs, the command palette — gets the same tone and
    // accent as the page content. The /appearance page mirrors these same
    // properties onto document.documentElement for its instant live preview.
    const themeCss = `:root{--brand:${brand};--brand-hover:${brand}CC;--surface-900:${tone.surface.s900};--surface-800:${tone.surface.s800};--surface-700:${tone.surface.s700};--surface-600:${tone.surface.s600};}`;

    return (
        <main className="min-h-screen text-gray-400">
            <style>{themeCss}</style>
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

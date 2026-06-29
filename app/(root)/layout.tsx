import Header from "@/components/Header";
import HomeOnlyFooter from "@/components/HomeOnlyFooter";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import SideNav from "@/components/SideNav";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { accentHex } from "@/lib/accent";
import { buildThemeCss, themeFromMain, lightIdFromMain } from "@/lib/appearance";
import { isPowerUserEmail } from "@/lib/constants";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

// Auth is handled by the main Feedcast app (SSO). The site is PUBLIC so it can
// be indexed for SEO — anonymous visitors see all content with default theming.
// Membership is only required to *customize* (dashboard layout, watchlist,
// alerts, appearance); those pages/actions self-gate. So no blanket redirect
// here — `user` may be null and the layout falls back to sensible defaults.

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const sessionUser: User | null = user
        ? {
              id: user.id,
              name:
                  (meta.full_name as string) ||
                  (meta.name as string) ||
                  user.email?.split('@')[0] ||
                  'Investor',
              email: user.email ?? '',
          }
        : null;

    // Pull the member's appearance picks from user_preferences.reading_preferences.
    // These are the SAME keys the main app (www.feedcast.news) writes — theme,
    // accent and background all sync across the two sites (see lib/appearance.ts
    // SHARED_PREF_KEYS). RLS scopes the read to the logged-in user; missing keys
    // fall back to the defaults (gold accent, Auto theme, Obsidian/Pearl tones).
    const prefsPromise = (async (): Promise<{ accentColor?: string; darkBackground?: string; lightBackground?: string; theme?: string }> => {
        if (!user) return {};
        try {
            const { data } = await supabase
                .from('user_preferences')
                .select('reading_preferences')
                .eq('id', user.id)
                .maybeSingle();
            return (data?.reading_preferences as {
                accentColor?: string;
                darkBackground?: string;
                lightBackground?: string;
                theme?: string;
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
    const mode = themeFromMain(prefs.theme);
    const powerUser = sessionUser ? isPowerUserEmail(sessionUser.email) : false;

    // Injected as a :root override (rather than inline on <main>) so portaled
    // UI — dropdowns, dialogs, the command palette — gets the same theme and
    // accent as the page content. Dark/light/auto each set the full gray scale
    // (auto via a prefers-color-scheme media query). The /appearance page
    // mirrors these onto document.documentElement for its instant live preview.
    const themeCss = buildThemeCss(mode, prefs.darkBackground, lightIdFromMain(prefs.lightBackground), brand);

    return (
        <main className="min-h-screen text-gray-400">
            <style>{themeCss}</style>
            <ThemeProvider mode={mode}>
                <Header user={sessionUser} initialStocks={initialStocks} isPowerUser={powerUser} />

                {/* Centered app shell — sidebar + content read as one centered block
                    on wide screens, mirroring the main Feedcast layout. */}
                <div className="mx-auto w-full max-w-[1660px] px-4 md:px-6 lg:px-8">
                    <div className="flex md:gap-6">
                        <SideNav initialStocks={initialStocks} isPowerUser={powerUser} />
                        <div className="min-w-0 flex-1">
                            <div className="mx-auto w-full max-w-[1400px] py-8 md:py-10">
                                <AuthProvider isAuthed={!!sessionUser}>
                                    {children}
                                </AuthProvider>
                            </div>
                        </div>
                    </div>
                </div>

                <HomeOnlyFooter />
                <DisclaimerFooter />
            </ThemeProvider>
        </main>
    )
}
export default Layout

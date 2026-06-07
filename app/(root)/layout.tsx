import Header from "@/components/Header";
import { redirect } from "next/navigation";
import HomeOnlyFooter from "@/components/HomeOnlyFooter";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={sessionUser} />

            <div className="container py-10">
                {children}
            </div>

            <HomeOnlyFooter />
        </main>
    )
}
export default Layout

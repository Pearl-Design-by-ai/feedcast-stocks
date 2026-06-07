import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Auth is handled by the main Feedcast app (SSO). Unauthenticated users
// are bounced to the Feedcast sign-in.
const SIGN_IN_URL = 'https://www.feedcast.news/?signin=markets';

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
        <div className="min-h-screen flex flex-col text-foreground">
            <Header user={sessionUser} />

            {/* Unified, centered app shell mirroring Feedcast: the left rail
                and the content column live inside one mx-auto block so on wide
                screens the whole UI reads as a single centered surface. */}
            <main className="flex-1">
                <div className="mx-auto w-full max-w-[1660px]">
                    <div className="flex pl-3 md:pl-4">
                        <SideNav />
                        <div className="flex-1 min-w-0">
                            <div className="container py-8 md:py-10">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
export default Layout

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import AdminConsole from '@/components/admin/AdminConsole';
import { getDiagnostics } from '@/lib/actions/admin.actions';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isPowerUserEmail } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Admin · Diagnostics',
};

// Always live — diagnostics must reflect current feed state, never a build cache.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // Owner-only console. The group layout gates members; this restricts further
    // to the power-user account and 404s for everyone else.
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isPowerUserEmail(user?.email)) notFound();

    const report = await getDiagnostics();

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <ShieldCheck className="text-teal-400" /> Admin · Diagnostics
                </h1>
                <p className="max-w-3xl text-sm text-gray-400">
                    Live operational health for FeedCast Markets — upstream data feeds, end-of-day close freshness,
                    the valuation cron and wired secrets. Everything the public site depends on, in one place. Probes
                    run in the private engine and are pulled fresh on every load.
                </p>
            </header>

            {report ? (
                <AdminConsole initial={report} />
            ) : (
                <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6 text-sm text-red-400">
                    The markets engine is unreachable — diagnostics can&apos;t be loaded right now. The engine itself
                    may be down or the <code className="font-mono">MARKETS_ENGINE_URL</code> /{' '}
                    <code className="font-mono">MARKETS_ENGINE_TOKEN</code> secrets may be unset.
                </div>
            )}
        </div>
    );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { canViewStats } from '@/lib/analytics/owner';
import { aggregateStats, windowStart, type PageViewRow, type Ranked } from '@/lib/analytics/stats';
import DailyBars from '@/components/analytics/DailyBars';

// Owner-only, per-request, never cached or indexed.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'My Stats',
    robots: { index: false, follow: false },
};

const PAGE = 1000;
const MAX_ROWS = 100_000;
const MAX_EMAILS = 50;

/** Every row of the last 30 days (the widest range), paged past PostgREST's row cap. */
async function loadRows(now: Date): Promise<PageViewRow[] | null> {
    const admin = getSupabaseAdmin();
    const since = windowStart(30, now);
    const rows: PageViewRow[] = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
        const { data, error } = await admin
            .from('markets_page_views')
            .select('created_at, path, referrer_host, country, device, visitor_hash, user_id, is_owner, is_bot')
            .gte('created_at', since)
            .order('id', { ascending: true })
            .range(from, from + PAGE - 1);
        if (error) {
            console.error('my-stats: load failed', error.message);
            return null;
        }
        rows.push(...((data ?? []) as PageViewRow[]));
        if (!data || data.length < PAGE) break;
    }
    return rows;
}

async function resolveEmails(ids: string[]): Promise<string[]> {
    const admin = getSupabaseAdmin();
    const out = await Promise.all(
        ids.slice(0, MAX_EMAILS).map(async (id) => {
            try {
                const { data } = await admin.auth.admin.getUserById(id);
                return data.user?.email ?? id;
            } catch {
                return id;
            }
        }),
    );
    return out.sort();
}

function href(range: number, owner: boolean, bots: boolean) {
    const p = new URLSearchParams({ range: String(range) });
    if (owner) p.set('owner', '1');
    if (bots) p.set('bots', '1');
    return `/my-stats?${p}`;
}

function Toggle({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={to}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                active ? 'border-teal-500/60 bg-teal-500/15 text-teal-300' : 'border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
        >
            {children}
        </Link>
    );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-100 tabular-nums">{value}</div>
            {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
        </div>
    );
}

function RankList({ title, items }: { title: string; items: Ranked }) {
    const max = items[0]?.count ?? 1;
    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-200">{title}</h2>
            {items.length === 0 ? (
                <p className="text-xs text-gray-500">No data yet.</p>
            ) : (
                <ul className="flex flex-col gap-1.5">
                    {items.map((it) => (
                        <li key={it.key} className="relative flex items-center justify-between gap-3 overflow-hidden rounded px-2 py-1 text-xs">
                            <span className="absolute inset-y-0 left-0 bg-teal-500/10" style={{ width: `${(it.count / max) * 100}%` }} />
                            <span className="relative truncate text-gray-300">{it.key}</span>
                            <span className="relative text-gray-400 tabular-nums">{it.count}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default async function MyStatsPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string; owner?: string; bots?: string }>;
}) {
    // Owner-only, hidden (404) for everyone else — same gate as /admin.
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!canViewStats(user)) notFound();

    const sp = await searchParams;
    const days = sp.range === '30' ? 30 : 7;
    const includeOwner = sp.owner === '1';
    const includeBots = sp.bots === '1';

    const now = new Date();
    const rows = await loadRows(now);
    const stats = rows ? aggregateStats(rows, { days, now, includeOwner, includeBots }) : null;
    const emails = stats ? await resolveEmails(stats.signedInUserIds) : [];

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <BarChart3 className="text-teal-400" /> My Stats
                </h1>
                <p className="max-w-3xl text-sm text-gray-400">
                    Cookieless first-party page views for FeedCast Markets. Visitor hashes rotate daily, so uniques are per
                    day and returning visitors are only recognisable when signed in. Only visible to you.
                </p>
            </header>

            <div className="flex flex-wrap items-center gap-2">
                <Toggle to={href(7, includeOwner, includeBots)} active={days === 7}>Last 7 days</Toggle>
                <Toggle to={href(30, includeOwner, includeBots)} active={days === 30}>Last 30 days</Toggle>
                <span className="mx-1 h-4 w-px bg-gray-700" />
                <Toggle to={href(days, !includeOwner, includeBots)} active={includeOwner}>Include my visits</Toggle>
                <Toggle to={href(days, includeOwner, !includeBots)} active={includeBots}>Include bots</Toggle>
            </div>

            {!stats ? (
                <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6 text-sm text-red-400">
                    Page views couldn&apos;t be loaded — the <code className="font-mono">markets_page_views</code> table may
                    not exist yet (migration 009) or <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> is unset.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <Stat label="Page views" value={stats.pageViews} />
                        <Stat
                            label="Unique visitors"
                            value={stats.uniqueVisitors}
                            hint={`≈ ${(stats.uniqueVisitors / days).toFixed(1)} / day`}
                        />
                        <Stat label="Returning" value={stats.returningVisitors} hint="signed-in, 2+ days" />
                        <Stat label="Signed-in users" value={stats.signedInUserIds.length} hint="excluding you" />
                        <Stat label="DNT / GPC views" value={stats.optOutViews} hint="counted, not hashed" />
                        <Stat
                            label="Bot share"
                            value={`${(stats.bots.share * 100).toFixed(1)}%`}
                            hint={`${stats.bots.count} of ${stats.bots.total} views`}
                        />
                    </div>

                    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                        <h2 className="mb-1 text-sm font-semibold text-gray-200">Daily</h2>
                        <p className="mb-3 text-xs text-gray-500">Wide bars: page views · narrow bars: unique visitors (UTC days)</p>
                        <DailyBars data={stats.daily} />
                    </section>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <RankList title="Top pages" items={stats.topPages} />
                        <RankList title="Top tickers" items={stats.topTickers} />
                        <RankList title="Top referrers" items={stats.topReferrers} />
                        <RankList title="Countries" items={stats.countries} />
                        <RankList title="Devices" items={stats.devices} />
                        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                            <h2 className="mb-3 text-sm font-semibold text-gray-200">Signed-in users (not you)</h2>
                            {emails.length === 0 ? (
                                <p className="text-xs text-gray-500">None in this period.</p>
                            ) : (
                                <ul className="flex flex-col gap-1 text-xs text-gray-300">
                                    {emails.map((e) => (
                                        <li key={e} className="truncate">{e}</li>
                                    ))}
                                </ul>
                            )}
                            {stats.signedInUserIds.length > MAX_EMAILS && (
                                <p className="mt-2 text-xs text-gray-500">Showing the first {MAX_EMAILS}.</p>
                            )}
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}

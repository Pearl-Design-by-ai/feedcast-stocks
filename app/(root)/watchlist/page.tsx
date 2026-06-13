import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getGroupItems } from '@/lib/actions/watchlist.actions';
import { listGroups } from '@/lib/actions/watchlist-groups.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews, getWatchlistData } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import WatchlistGroupBar from '@/components/watchlist/WatchlistGroupBar';
import WatchlistDigest from '@/components/watchlist/WatchlistDigest';
import NewsImpact from '@/components/watchlist/NewsImpact';
import DivergenceRadar from '@/components/watchlist/DivergenceRadar';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import DataDisclaimer from '@/components/DataDisclaimer';
import { Loader2 } from 'lucide-react';

type GroupItems = Awaited<ReturnType<typeof getGroupItems>>;

async function TableSection({ items, groupId }: { items: GroupItems; groupId: number }) {
    const stockData = await getWatchlistData(items.map((i) => i.symbol));
    return <WatchlistManager initialItems={items} initialData={stockData} groupId={groupId} />;
}

async function NewsSection({ symbols }: { symbols: string[] }) {
    const news = await getNews(symbols.length > 0 ? symbols : undefined).catch(() => []);
    return <NewsGrid news={news || []} />;
}

async function AlertsSection({ userId }: { userId: string }) {
    const alerts = await getUserAlerts(userId);
    return <AlertsPanel alerts={alerts} />;
}

function TableSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            Loading live data for this watchlist…
        </div>
    );
}

function EmptyGroup() {
    return (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center text-sm text-gray-500">
            This watchlist is empty. Add a ticker above, or star stocks from any{' '}
            <span className="text-gray-300">stock page</span> to drop them into your default list.
        </div>
    );
}

export default async function WatchlistPage({
    searchParams,
}: {
    searchParams: Promise<{ list?: string }>;
}) {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('https://www.feedcast.news/?signin=stocks');

    const userId = user.id;
    const { list } = await searchParams;

    const groups = await listGroups();
    const requested = list ? Number(list) : NaN;
    const active = groups.find((g) => g.id === requested) ?? groups[0];
    const items = active ? await getGroupItems(active.id) : [];
    const symbols = items.map((i) => i.symbol);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                    Watchlists
                </h1>
                <p className="mt-1 text-gray-500">
                    Track up to five separate lists — by theme, conviction, or whatever fits how you invest.
                </p>
            </div>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            {active && <WatchlistGroupBar groups={groups} activeId={active.id} />}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {items.length === 0 ? (
                        <EmptyGroup />
                    ) : (
                        <Suspense key={active?.id} fallback={<TableSkeleton />}>
                            <TableSection items={items} groupId={active!.id} />
                        </Suspense>
                    )}

                    {symbols.length > 0 && (
                        <>
                            <Suspense fallback={null}>
                                <WatchlistDigest symbols={symbols} />
                            </Suspense>
                            <Suspense fallback={null}>
                                <NewsImpact symbols={symbols} />
                            </Suspense>
                            <Suspense fallback={null}>
                                <DivergenceRadar symbols={symbols} />
                            </Suspense>
                        </>
                    )}

                    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-500" /></div>}>
                        <NewsSection symbols={symbols} />
                    </Suspense>
                </div>

                <div className="lg:col-span-1">
                    <Suspense fallback={null}>
                        <AlertsSection userId={userId} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

import React, { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getGroupItems } from '@/lib/actions/watchlist.actions';
import { listGroups, getGroupsPortfolio } from '@/lib/actions/watchlist-groups.actions';
import { getNews, getWatchlistData } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import WatchlistGroupBar from '@/components/watchlist/WatchlistGroupBar';
import WatchlistDigest from '@/components/watchlist/WatchlistDigest';
import NewsImpact from '@/components/watchlist/NewsImpact';
import DivergenceRadar from '@/components/watchlist/DivergenceRadar';
import NewsGrid from '@/components/watchlist/NewsGrid';
import DataDisclaimer from '@/components/DataDisclaimer';
import RelatedLinks from '@/components/common/RelatedLinks';
import { isPowerUserEmail } from '@/lib/constants';
import { Loader2, Bell } from 'lucide-react';

export const metadata = {
    title: 'Watchlists',
    description: 'Track up to five separate lists — by theme, conviction, or however you invest.',
};

type GroupItems = Awaited<ReturnType<typeof getGroupItems>>;

async function TableSection({ items, groupId }: { items: GroupItems; groupId: number }) {
    const stockData = await getWatchlistData(items.map((i) => i.symbol));
    return <WatchlistManager initialItems={items} initialData={stockData} groupId={groupId} />;
}

async function NewsSection({ symbols }: { symbols: string[] }) {
    const news = await getNews(symbols.length > 0 ? symbols : undefined).catch(() => []);
    return <NewsGrid news={news || []} />;
}

function TableSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-10 text-sm text-gray-500">
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

    const unlimited = isPowerUserEmail(user.email);
    const { list } = await searchParams;

    // Lists + each list's portfolio move run in parallel — the portfolio scan
    // queries by user, so it doesn't need the groups first.
    const [groups, portfolios] = await Promise.all([listGroups(), getGroupsPortfolio()]);
    const requested = list ? Number(list) : NaN;
    const active = groups.find((g) => g.id === requested) ?? groups[0];
    const items = active ? await getGroupItems(active.id) : [];
    const symbols = items.map((i) => i.symbol);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        Watchlists
                    </h1>
                    <p className="mt-1 max-w-2xl text-base font-semibold text-gray-200">What changed in my names today?</p>
                    <p className="mt-1 text-gray-500">
                        Track up to five separate lists — by theme, conviction, or whatever fits how you invest.
                    </p>
                </div>
                <Link
                    href="/alerts"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3.5 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-yellow-500/40 hover:text-yellow-400"
                >
                    <Bell size={15} className="text-yellow-500" /> Price alerts
                </Link>
            </div>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            {active && <WatchlistGroupBar groups={groups} activeId={active.id} portfolios={portfolios} unlimited={unlimited} />}

            <div className="mt-6 space-y-8">
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

                <RelatedLinks
                    title="Run your names through the research stack"
                    items={[
                        { href: '/buy-sell-signals', label: 'Buy & Sell Signals', desc: 'Where the broad tape stands for your holdings' },
                        { href: '/bubble-detector', label: 'Bubble Detector', desc: 'Are any of your names stretched or cracking?' },
                        { href: '/valuation', label: 'Valuation', desc: 'Check if your names screen rich or cheap' },
                        { href: '/portfolio-lab', label: 'Portfolio Labs', desc: 'Turn a list into a weighted, scored basket' },
                    ]}
                />
            </div>
        </div>
    );
}

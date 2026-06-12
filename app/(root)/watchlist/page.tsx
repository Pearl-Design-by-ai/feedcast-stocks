import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews, getWatchlistData } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import WatchlistDigest from '@/components/watchlist/WatchlistDigest';
import NewsImpact from '@/components/watchlist/NewsImpact';
import DivergenceRadar from '@/components/watchlist/DivergenceRadar';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import DataDisclaimer from '@/components/DataDisclaimer';
import { Loader2 } from 'lucide-react';

/**
 * Streamed in its own Suspense boundary: the enriched per-symbol fetch
 * (quote + profile + P/E + 2y closes) is the slowest part of the page, so it
 * must not block first paint.
 */
async function TableSection({
    watchlistItems,
}: {
    watchlistItems: Awaited<ReturnType<typeof getUserWatchlist>>;
}) {
    const stockData = await getWatchlistData(watchlistItems.map((i) => i.symbol));
    return <WatchlistManager initialItems={watchlistItems} initialData={stockData} />;
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
            Loading live data for your watchlist…
        </div>
    );
}

export default async function WatchlistPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('https://www.feedcast.news/?signin=stocks');
    }

    const userId = user.id;

    // Only the (fast) watchlist rows block the page shell — every slow data
    // source below streams into its own Suspense boundary.
    const watchlistItems = await getUserWatchlist(userId);
    const watchlistSymbols = watchlistItems.map((item) => item.symbol);

    return (
        // bg-gray-900 (not bg-black) so the member's chosen background tone applies.
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        Watchlist
                    </h1>
                    <p className="text-gray-500 mt-1">Track your favorite stocks and manage alerts.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={[]} />
                </div>
            </div>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content - Watchlist Table */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-6">
                        <Suspense fallback={<TableSkeleton />}>
                            <TableSection watchlistItems={watchlistItems} />
                        </Suspense>
                    </div>

                    <Suspense fallback={null}>
                        <WatchlistDigest symbols={watchlistSymbols} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <NewsImpact symbols={watchlistSymbols} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <DivergenceRadar symbols={watchlistSymbols} />
                    </Suspense>

                    {/* News Section */}
                    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-500" /></div>}>
                        <NewsSection symbols={watchlistSymbols} />
                    </Suspense>
                </div>

                {/* Sidebar - Alerts */}
                <div className="lg:col-span-1">
                    <Suspense fallback={null}>
                        <AlertsSection userId={userId} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

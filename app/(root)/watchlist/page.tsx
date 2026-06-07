import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews, getWatchlistData } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import DataDisclaimer from '@/components/DataDisclaimer';
import { Loader2 } from 'lucide-react';

export default async function WatchlistPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('https://www.feedcast.news/?signin=markets');
    }

    const userId = user.id;

    // Parallel data fetching
    const [watchlistItems, alerts, news] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
        getNews() // Initial news fetch
    ]);

    const watchlistSymbols = watchlistItems.map((item) => item.symbol);

    // Live market data for the table + (when there are symbols) more relevant
    // news, fetched together.
    const [stockData, relevantNews] = await Promise.all([
        getWatchlistData(watchlistSymbols),
        watchlistSymbols.length > 0 ? getNews(watchlistSymbols) : Promise.resolve(news),
    ]);

    return (
        <div className="min-h-screen bg-black text-gray-100 p-6 md:p-8">
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
                        <WatchlistManager initialItems={watchlistItems} initialData={stockData} userId={userId} />
                    </div>

                    {/* News Section */}
                    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-500" /></div>}>
                        <NewsGrid news={relevantNews || []} />
                    </Suspense>
                </div>

                {/* Sidebar - Alerts */}
                <div className="lg:col-span-1">
                    <AlertsPanel alerts={alerts} />
                </div>
            </div>
        </div>
    );
}

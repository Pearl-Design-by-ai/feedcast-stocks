import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getQuote } from '@/lib/actions/finnhub.actions';
import AlertsManager, { type AlertItem } from '@/components/alerts/AlertsManager';
import DataDisclaimer from '@/components/DataDisclaimer';

export const metadata: Metadata = {
    title: 'Price Alerts',
    description:
        'Set price alerts on any stock — we watch live prices and email you the moment your target is hit.',
};

export default async function AlertsPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('https://www.feedcast.news/?signin=stocks');

    const [alerts, watchlist] = await Promise.all([
        getUserAlerts(user.id) as Promise<AlertItem[]>,
        getUserWatchlist(user.id),
    ]);

    // Quote each distinct symbol once so every alert can show live distance to
    // its target. getQuote is KV-cached; alert counts per user are small.
    const symbols = [...new Set(alerts.map((a) => a.symbol.toUpperCase()))];
    const quoteEntries = await Promise.all(
        symbols.map(async (sym) => {
            const q = await getQuote(sym).catch(() => null);
            return [sym, q?.c ?? null] as const;
        })
    );
    const prices: Record<string, number | null> = Object.fromEntries(quoteEntries);

    const suggestions = [...new Set(watchlist.map((w) => w.symbol.toUpperCase()))].sort();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            <div className="mb-6">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <Bell className="text-yellow-500" /> Price Alerts
                </h1>
                <p className="mt-1 max-w-2xl text-gray-500">
                    Get notified when a stock hits the price you care about — set a target, and we email you
                    the moment it crosses.
                </p>
            </div>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <AlertsManager alerts={alerts} prices={prices} suggestions={suggestions} />
        </div>
    );
}

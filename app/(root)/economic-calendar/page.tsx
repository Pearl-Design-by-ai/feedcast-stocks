import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ECONOMIC_CALENDAR_WIDGET_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Economic Calendar',
    description:
        'Upcoming macro events that move markets — CPI, central-bank rate decisions, jobs reports and more, by country and importance.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default function EconomicCalendarPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Economic Calendar</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        The macro events that move markets — inflation prints, central-bank rate
                        decisions, jobs reports and growth data — across major economies, filtered
                        to medium and high importance.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}events.js`}
                    config={ECONOMIC_CALENDAR_WIDGET_CONFIG}
                    height={650}
                />
            </div>
        </div>
    );
}

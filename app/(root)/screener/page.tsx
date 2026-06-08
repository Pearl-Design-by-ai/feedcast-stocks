import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import { SCREENER_WIDGET_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Screener',
    description:
        'Screen US stocks by price, performance, valuation and technicals to surface ideas and movers.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default function ScreenerPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Screener</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Filter US stocks by performance, valuation and technicals to surface movers
                        and ideas. Switch the column set and preset screens from the toolbar.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}screener.js`}
                    config={SCREENER_WIDGET_CONFIG}
                    height={650}
                />
            </div>
        </div>
    );
}

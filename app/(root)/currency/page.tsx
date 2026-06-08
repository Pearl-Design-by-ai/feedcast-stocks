import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import CurrencyPairs from '@/components/currency/CurrencyPairs';
import {
    FOREX_HEATMAP_WIDGET_CONFIG,
    FOREX_CROSS_RATES_WIDGET_CONFIG,
} from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Currency',
    description:
        'A comprehensive forex dashboard — USD currency strength, cross rates, and every major USD pair with live charts and technical-analysis expectations.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default function CurrencyPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Currency</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A comprehensive forex dashboard. Start with US-dollar strength and cross
                        rates, then drill into every major USD pair — each with a live price chart
                        and a technical-analysis gauge summarizing the key indicators into a
                        buy/sell expectation.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Dollar Strength &amp; Cross Rates</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-100">
                            Currency Strength Heat Map
                        </h3>
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}forex-heat-map.js`}
                            config={FOREX_HEATMAP_WIDGET_CONFIG}
                            height={400}
                        />
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-100">Cross Rates</h3>
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}forex-cross-rates.js`}
                            config={FOREX_CROSS_RATES_WIDGET_CONFIG}
                            height={400}
                        />
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">USD Pairs</h2>
                <CurrencyPairs />
            </section>
        </div>
    );
}

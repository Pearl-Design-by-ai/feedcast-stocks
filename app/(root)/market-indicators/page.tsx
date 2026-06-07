import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import MarketIndicators from '@/components/market-indicators/MarketIndicators';

export const metadata: Metadata = {
    title: 'Market Indicators',
    description:
        'Forty market indicators across trend, momentum, volume, volatility, breadth, sentiment, and rates & credit.',
};

export default function MarketIndicatorsPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Market Indicators</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A market-wide dashboard of 40 indicators — trend, momentum, volume &amp;
                        flow, volatility, breadth, sentiment, and rates &amp; credit — to read the
                        overall regime at a glance. Charts are live TradingView feeds.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <MarketIndicators />
        </div>
    );
}

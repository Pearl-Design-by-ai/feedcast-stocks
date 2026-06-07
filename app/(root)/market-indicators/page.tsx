import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import MarketIndicators from '@/components/market-indicators/MarketIndicators';
import MarketMood from '@/components/market-indicators/MarketMood';
import { getCryptoFearGreed } from '@/lib/actions/market-mood.actions';

export const metadata: Metadata = {
    title: 'Market Indicators',
    description:
        'A market-wide dashboard across trend, momentum, volume, volatility, breadth, sentiment, rates & credit, macro, valuation, liquidity and crypto.',
};

export default async function MarketIndicatorsPage() {
    const fng = await getCryptoFearGreed();

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Market Indicators</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A market-wide dashboard — trend, momentum, volume &amp; flow, volatility,
                        breadth, sentiment, rates &amp; credit, macro &amp; cross-asset, valuation,
                        liquidity and crypto — to read the overall regime at a glance.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Market Mood</h2>
                <MarketMood fng={fng} />
            </section>

            <MarketIndicators />
        </div>
    );
}

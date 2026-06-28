import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import RelatedLinks from '@/components/common/RelatedLinks';
import MarketIndicators from '@/components/market-indicators/MarketIndicators';
import MarketMood from '@/components/market-indicators/MarketMood';
import { getCryptoFearGreed } from '@/lib/actions/market-mood.actions';
import { getIndicatorCatalog } from '@/lib/actions/indicators.actions';

export const metadata: Metadata = {
    title: 'Market Indicators',
    description:
        'A market-wide dashboard across trend, momentum, volume, volatility, breadth, sentiment, rates & credit, macro, valuation, liquidity and crypto.',
};

export default async function MarketIndicatorsPage() {
    const [fng, categories] = await Promise.all([getCryptoFearGreed(), getIndicatorCatalog()]);

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Market Indicators</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">What are the market&apos;s internals saying at a glance?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A market-wide dashboard — trend, momentum, volume &amp; flow, volatility,
                        breadth, sentiment, rates &amp; credit, macro &amp; cross-asset, valuation,
                        liquidity and crypto — to read the overall regime at a glance.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <ScoreMethodology
                methodology="The Market Mood gauge blends sentiment measures (led by the Crypto Fear & Greed index) into one 0–100 reading; below it, each indicator category — trend, momentum, volume & flow, volatility, breadth, sentiment, rates & credit, macro, valuation, liquidity and crypto — reports its own live measurement with a plain-language interpretation."
                cadence="Indicators refresh from end-of-day / latest-available data on each visit (cached minutes to hours by source); most move once per trading day."
                thresholds="Market Mood: 0–24 Extreme Fear · 25–44 Fear · 45–55 Neutral · 56–74 Greed · 75–100 Extreme Greed. Each indicator card labels its own bullish / neutral / bearish read."
            />

            <AiCommentary />

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Market Mood</h2>
                <MarketMood fng={fng} />
            </section>

            <MarketIndicators categories={categories} />

            <RelatedLinks
                items={[
                    { href: '/market-regime', label: 'Market Regime', desc: 'Roll the internals up into one risk verdict' },
                    { href: '/buy-sell-signals', label: 'Buy & Sell Signals', desc: 'Graded calls for the major indices' },
                    { href: '/crash-detector', label: 'Crash Detector', desc: 'Where the indicators sit in the cycle' },
                ]}
            />
        </div>
    );
}

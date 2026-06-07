import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import InstrumentAccordion from '@/components/markets/InstrumentAccordion';
import CryptoFearGreedGauge from '@/components/markets/CryptoFearGreedGauge';
import { CRYPTO_GROUPS, CRYPTO_MARKET_LINKS } from '@/lib/crypto-assets';
import { CRYPTO_HEATMAP_WIDGET_CONFIG } from '@/lib/constants';
import { getCryptoFearGreed } from '@/lib/actions/market-mood.actions';

export const metadata: Metadata = {
    title: 'Crypto',
    description:
        'A comprehensive crypto dashboard — live coin charts and technical views, a market-cap heatmap, the Crypto Fear & Greed index, and BTC dominance / total cap.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const tvLink = (symbol: string) =>
    `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;

export default async function CryptoPage() {
    const fng = await getCryptoFearGreed();

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Crypto</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A comprehensive crypto dashboard — market mood and a cap-weighted heatmap,
                        BTC dominance and total market cap, then live charts with a technical
                        “market view” for every major coin.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            {/* Mood + heatmap */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <CryptoFearGreedGauge fng={fng} />
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 xl:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-gray-100">Market-Cap Heat Map</h3>
                    <TradingViewWidget
                        scriptUrl={`${SCRIPT}crypto-coins-heatmap.js`}
                        config={CRYPTO_HEATMAP_WIDGET_CONFIG}
                        height={500}
                    />
                </div>
            </section>

            {/* Market-wide measures (gated → link out) */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Market-Wide</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {CRYPTO_MARKET_LINKS.map((m) => (
                        <a
                            key={m.symbol}
                            href={tvLink(m.symbol)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-900/40 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800/50"
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="text-base font-semibold text-gray-100">
                                    {m.label}
                                </span>
                                <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-teal-400" />
                            </span>
                            <span className="text-sm text-gray-400">{m.blurb}</span>
                        </a>
                    ))}
                </div>
            </section>

            {/* Coins */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Coins</h2>
                <InstrumentAccordion groups={CRYPTO_GROUPS} category="Crypto" />
            </section>
        </div>
    );
}

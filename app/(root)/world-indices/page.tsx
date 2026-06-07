import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import WorldEtfs from '@/components/world/WorldEtfs';
import { WORLD_GROUPS } from '@/lib/world-indices';

export const metadata: Metadata = {
    title: 'World Indices',
    description:
        'Global equity markets via their USD-listed country ETFs — a performance snapshot plus live charts and technical market views for each.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

// Broad performance snapshot, generated from the same ETF catalog.
const QUOTES_CONFIG = {
    title: 'World Markets',
    width: '100%',
    height: 550,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: WORLD_GROUPS.map((group) => ({
        name: group.label,
        symbols: group.etfs.map((etf) => ({
            name: etf.symbol,
            displayName: `${etf.name} (${etf.code})`,
        })),
    })),
};

export default function WorldIndicesPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">World Indices</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Global equity markets through their USD-listed country ETFs. Start with a
                        performance snapshot across regions, then drill into each market — every
                        ETF carries a live price chart and a technical-analysis “market view”
                        (the indicators rolled into a buy/sell rating).
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Performance Snapshot</h2>
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <TradingViewWidget
                        scriptUrl={`${SCRIPT}market-quotes.js`}
                        config={QUOTES_CONFIG}
                        height={550}
                    />
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Markets by Region</h2>
                <WorldEtfs />
            </section>
        </div>
    );
}

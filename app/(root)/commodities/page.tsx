import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import InstrumentAccordion from '@/components/markets/InstrumentAccordion';
import { COMMODITY_GROUPS } from '@/lib/commodities';

export const metadata: Metadata = {
    title: 'Commodities',
    description:
        'Energy, metals and agricultural commodities via USD-listed ETFs — a performance snapshot plus live charts and technical market views.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

const QUOTES_CONFIG = {
    title: 'Commodities',
    width: '100%',
    height: 550,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: COMMODITY_GROUPS.map((group) => ({
        name: group.label,
        symbols: group.items.map((it) => ({
            name: it.symbol,
            displayName: `${it.title} (${it.subtitle})`,
        })),
    })),
};

export default function CommoditiesPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Commodities</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Energy, metals and agriculture via USD-listed ETFs. A performance snapshot
                        across complexes, then a live chart and a technical “market view” for each.
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
                <h2 className="text-xl font-semibold text-gray-100">By Complex</h2>
                <InstrumentAccordion groups={COMMODITY_GROUPS} category="Commodities" />
            </section>
        </div>
    );
}

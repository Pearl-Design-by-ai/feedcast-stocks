import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import InstrumentCard from '@/components/markets/InstrumentCard';
import { SECTOR_ETFS } from '@/lib/sectors';

export const metadata: Metadata = {
    title: 'Sectors',
    description:
        'US equity sectors via the SPDR Select Sector ETFs — a performance snapshot plus live charts and technical market views for each, to read sector rotation.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

const QUOTES_CONFIG = {
    title: 'US Sectors',
    width: '100%',
    height: 500,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: [
        {
            name: 'Sectors',
            symbols: SECTOR_ETFS.map((s) => ({
                name: s.symbol,
                displayName: `${s.name} (${s.code})`,
            })),
        },
    ],
};

export default function SectorsPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Sectors</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        The 11 US equity sectors via the SPDR Select Sector ETFs. Read sector
                        rotation — which parts of the market lead and lag — with a performance
                        snapshot and a live chart + technical “market view” for each.
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
                        height={500}
                    />
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Sector ETFs</h2>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {SECTOR_ETFS.map((s) => (
                        <InstrumentCard
                            key={s.symbol}
                            title={s.name}
                            subtitle={s.code}
                            symbol={s.symbol}
                            category="Sectors"
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

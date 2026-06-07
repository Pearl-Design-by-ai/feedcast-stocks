import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import TradingViewWidget from '@/components/TradingViewWidget';
import FixedIncomeEtfs from '@/components/fixed-income/FixedIncomeEtfs';
import { BOND_GROUPS, TREASURY_YIELDS, FIXED_INCOME_EDU } from '@/lib/fixed-income';

export const metadata: Metadata = {
    title: 'Fixed Income',
    description:
        'A comprehensive bond dashboard — US Treasury yields, the bond-ETF universe (Treasuries, IG, high yield, TIPS, munis, EM), live charts with buy/sell market views, and a Fixed Income 101 primer.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const tvLink = (symbol: string) =>
    `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;

// Broad performance snapshot, generated from the bond-ETF catalog.
const QUOTES_CONFIG = {
    title: 'Bond ETFs',
    width: '100%',
    height: 550,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: BOND_GROUPS.map((group) => ({
        name: group.label,
        symbols: group.etfs.map((etf) => ({
            name: etf.symbol,
            displayName: `${etf.name} (${etf.code})`,
        })),
    })),
};

export default function FixedIncomePage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Fixed Income</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A comprehensive bond dashboard — US Treasury yields, the bond-ETF universe
                        (Treasuries, corporates, high yield, TIPS, munis and emerging-market debt),
                        live charts with a technical buy/sell “market view” for each, plus a quick
                        primer on how fixed income works.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            {/* Treasury yields — link out (raw yield feeds are gated in the embed) */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">US Treasury Yields</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {TREASURY_YIELDS.map((y) => (
                        <a
                            key={y.symbol}
                            href={tvLink(y.symbol)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-900/40 p-4 transition-colors hover:border-gray-700 hover:bg-gray-800/50"
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="text-base font-semibold text-gray-100">
                                    {y.label}
                                </span>
                                <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-teal-400" />
                            </span>
                            <span className="text-sm text-gray-400">{y.blurb}</span>
                        </a>
                    ))}
                </div>
            </section>

            {/* Performance snapshot */}
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

            {/* Bond ETFs by sector */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Bond ETFs by Sector</h2>
                <FixedIncomeEtfs />
            </section>

            {/* Fixed Income 101 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Fixed Income 101</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {FIXED_INCOME_EDU.map((item) => (
                        <div
                            key={item.title}
                            className="flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-900/40 p-4"
                        >
                            <h3 className="text-base font-semibold text-gray-100">{item.title}</h3>
                            <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

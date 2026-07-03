import type { Metadata } from 'next';
import { Suspense } from 'react';
import AiCommentary from '@/components/ai/AiCommentary';
import DataDisclaimer from '@/components/DataDisclaimer';
import JsonLd from '@/components/JsonLd';
import RelatedLinks from '@/components/common/RelatedLinks';
import ReturnsTable from '@/components/markets/ReturnsTable';
import HubCategoryCard from '@/components/markets/HubCategoryCard';
import StockArt from '@/components/stocks/StockArt';
import { STOCK_CATEGORIES, TOTAL_LISTED_STOCK_COUNT, categoryStockCount } from '@/lib/stock-lists';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Stock Hub',
    description: `Browse ${TOTAL_LISTED_STOCK_COUNT}+ of the most-followed stocks by category — mega caps, dividends, growth, semiconductors, healthcare, financials, China ADRs, REITs and more, with live multi-period returns.`,
};

// The market read in ten bellwether names — one per corner of the tape.
const SPOTLIGHT_STOCKS = [
    { symbol: 'NVDA', label: 'NVIDIA (AI bellwether)' },
    { symbol: 'AAPL', label: 'Apple (consumer tech)' },
    { symbol: 'MSFT', label: 'Microsoft (enterprise)' },
    { symbol: 'JPM', label: 'JPMorgan (banks)' },
    { symbol: 'XOM', label: 'Exxon Mobil (energy)' },
    { symbol: 'LLY', label: 'Eli Lilly (pharma)' },
    { symbol: 'CAT', label: 'Caterpillar (industry)' },
    { symbol: 'WMT', label: 'Walmart (consumer)' },
    { symbol: 'PLD', label: 'Prologis (real estate)' },
    { symbol: 'COIN', label: 'Coinbase (crypto)' },
];

export default function StockHubPage() {
    const itemListLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Stock list categories',
        itemListElement: STOCK_CATEGORIES.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            url: `${SITE_URL}/stocks/lists/${c.id}`,
        })),
    };
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Stock Hub', item: `${SITE_URL}/stocks` },
        ],
    };

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <JsonLd data={[itemListLd, breadcrumbLd]} />
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Stock Hub</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">
                        Where in the market do you want to be?
                    </p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A curated directory of {TOTAL_LISTED_STOCK_COUNT} of the most-followed
                        US-listed stocks and ADRs, organized by role — mega caps, dividend payers,
                        growth, the chip complex, healthcare, financials, international names and
                        the speculative corners. Every ticker links into its full analysis page.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {STOCK_CATEGORIES.map((category) => (
                    <HubCategoryCard
                        key={category.id}
                        href={`/stocks/lists/${category.id}`}
                        label={category.label}
                        blurb={category.blurb}
                        countLabel={`${categoryStockCount(category)} stocks`}
                        samples={category.groups[0].stocks.slice(0, 3).map((st) => st.symbol)}
                        accent={category}
                        art={<StockArt category={category.id} />}
                    />
                ))}
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-gray-100">The Market in Ten Stocks</h2>
                    <p className="max-w-3xl text-sm text-gray-400">
                        One bellwether per corner of the market — a quick breadth read before you
                        drill into a category.
                    </p>
                </div>
                <Suspense fallback={null}>
                    <ReturnsTable rows={SPOTLIGHT_STOCKS} />
                </Suspense>
            </section>

            <RelatedLinks
                items={[
                    { href: '/screener', label: 'Screener', desc: 'Filter the whole market by your own criteria' },
                    { href: '/etfs', label: 'ETF Hub', desc: 'Take the same exposure through funds instead' },
                    { href: '/compare', label: 'Compare', desc: 'Chart any two names head-to-head' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Track the names you shortlist here' },
                ]}
            />
        </div>
    );
}

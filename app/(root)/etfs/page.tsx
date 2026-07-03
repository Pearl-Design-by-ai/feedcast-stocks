import type { Metadata } from 'next';
import { Suspense } from 'react';
import AiCommentary from '@/components/ai/AiCommentary';
import DataDisclaimer from '@/components/DataDisclaimer';
import JsonLd from '@/components/JsonLd';
import RelatedLinks from '@/components/common/RelatedLinks';
import ReturnsTable from '@/components/markets/ReturnsTable';
import EtfArt from '@/components/etfs/EtfArt';
import HubCategoryCard from '@/components/markets/HubCategoryCard';
import { ETF_CATEGORIES, SPOTLIGHT_ETFS, TOTAL_ETF_COUNT, categoryEtfCount } from '@/lib/etfs';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'ETF Hub',
    description: `Browse ${TOTAL_ETF_COUNT}+ of the most traded ETFs by category — US equity, sectors, bonds, dividends, international, commodities, crypto, leveraged and more, with live multi-period returns.`,
};

export default function EtfHubPage() {
    const itemListLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'ETF categories',
        itemListElement: ETF_CATEGORIES.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            url: `${SITE_URL}/etfs/${c.id}`,
        })),
    };
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'ETF Hub', item: `${SITE_URL}/etfs` },
        ],
    };

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <JsonLd data={[itemListLd, breadcrumbLd]} />
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">ETF Hub</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">
                        Which fund gives you the exposure you want?
                    </p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        A curated directory of {TOTAL_ETF_COUNT} of the most in-demand US-listed
                        ETFs, organized by what they actually do — core equity, sectors, bonds,
                        income, themes, commodities, crypto and the leveraged toolbox. Every
                        fund links into its full detail page with charts and analysis.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ETF_CATEGORIES.map((category) => (
                    <HubCategoryCard
                        key={category.id}
                        href={`/etfs/${category.id}`}
                        label={category.label}
                        blurb={category.blurb}
                        countLabel={`${categoryEtfCount(category)} ETFs`}
                        samples={category.groups[0].etfs.slice(0, 3).map((etf) => etf.symbol)}
                        accent={category}
                        art={<EtfArt category={category.id} />}
                    />
                ))}
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-gray-100">The Market in Ten ETFs</h2>
                    <p className="max-w-3xl text-sm text-gray-400">
                        One fund per asset class — a quick cross-asset read before you drill into
                        a category.
                    </p>
                </div>
                <Suspense fallback={null}>
                    <ReturnsTable
                        rows={SPOTLIGHT_ETFS.map((etf) => ({
                            symbol: etf.symbol,
                            label: `${etf.name} (${etf.symbol})`,
                        }))}
                    />
                </Suspense>
            </section>

            <RelatedLinks
                items={[
                    { href: '/sectors', label: 'Sectors', desc: 'Read the rotation behind the sector funds' },
                    { href: '/compare', label: 'Compare', desc: 'Chart any two funds against each other' },
                    { href: '/screener', label: 'Screener', desc: 'Hunt individual stocks instead' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Track the funds you shortlist here' },
                ]}
            />
        </div>
    );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import AiCommentary from '@/components/ai/AiCommentary';
import DataDisclaimer from '@/components/DataDisclaimer';
import JsonLd from '@/components/JsonLd';
import RelatedLinks from '@/components/common/RelatedLinks';
import SymbolGroupTable from '@/components/markets/SymbolGroupTable';
import { STOCK_CATEGORIES, categoryStockCount, getStockCategory } from '@/lib/stock-lists';
import { SITE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Props {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;
    const cat = getStockCategory(category);
    if (!cat) return { title: 'Stock Hub' };
    const count = categoryStockCount(cat);
    return {
        title: `${cat.label} Stocks`,
        description: `${count} ${cat.label} stocks with live multi-period returns — ${cat.blurb}`,
    };
}

function TableSkeleton({ rows }: { rows: number }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="flex animate-pulse flex-col gap-3">
                {Array.from({ length: Math.min(rows + 1, 8) }, (_, i) => (
                    <div key={i} className="h-5 rounded bg-gray-800/60" />
                ))}
            </div>
        </div>
    );
}

export default async function StockListPage({ params }: Props) {
    const { category } = await params;
    const cat = getStockCategory(category);
    if (!cat) notFound();
    const count = categoryStockCount(cat);

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Stock Hub', item: `${SITE_URL}/stocks` },
            { '@type': 'ListItem', position: 3, name: cat.label, item: `${SITE_URL}/stocks/lists/${cat.id}` },
        ],
    };
    const itemListLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${cat.label} stocks`,
        numberOfItems: count,
        itemListElement: cat.groups.flatMap((g) => g.stocks).map((st, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: `${st.symbol} — ${st.name}`,
            url: `${SITE_URL}/stocks/${st.symbol}`,
        })),
    };

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <JsonLd data={[breadcrumbLd, itemListLd]} />
            <header className="flex flex-col gap-3">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Stock list categories">
                    <Link href="/stocks" className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-200">
                        All categories
                    </Link>
                    {STOCK_CATEGORIES.map((c) => (
                        <Link
                            key={c.id}
                            href={`/stocks/lists/${c.id}`}
                            aria-current={c.id === cat.id ? 'page' : undefined}
                            className={cn(
                                'rounded-full border px-3 py-1 transition-colors',
                                c.id === cat.id
                                    ? cn('border-transparent font-semibold', c.chip)
                                    : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                            )}
                        >
                            {c.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">{cat.label}</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        {cat.intro} <span className="text-gray-500">({count} stocks)</span>
                    </p>
                </div>
                {cat.caution && (
                    <p className="flex w-fit max-w-3xl items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300/90">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        {cat.caution}
                    </p>
                )}
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            {cat.groups.map((group) => (
                <section key={group.id} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-xl font-semibold text-gray-100">{group.label}</h2>
                        <p className="max-w-3xl text-sm text-gray-400">{group.blurb}</p>
                    </div>
                    <Suspense fallback={<TableSkeleton rows={group.stocks.length} />}>
                        <SymbolGroupTable
                            rows={group.stocks.map((st) => ({ symbol: st.symbol, name: st.name }))}
                            nameLabel="Company"
                        />
                    </Suspense>
                </section>
            ))}

            <p className="text-[11px] text-gray-600">
                Returns approximated from adjusted end-of-day closes. Lists are curated for
                liquidity and coverage, not recommendations; membership changes — verify before
                trading.
            </p>

            <RelatedLinks
                items={[
                    { href: '/stocks', label: 'Stock Hub', desc: 'Back to all categories' },
                    { href: '/screener', label: 'Screener', desc: 'Filter the whole market yourself' },
                    { href: '/compare', label: 'Compare', desc: 'Chart two of these names head-to-head' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Track your shortlist with live data' },
                ]}
            />
        </div>
    );
}

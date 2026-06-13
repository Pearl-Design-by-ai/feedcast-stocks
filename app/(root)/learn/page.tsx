import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import ArticleCard from '@/components/learn/ArticleCard';
import { ARTICLES, CATEGORIES, getCategory, type CategoryId } from '@/lib/learn';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Learn — Financial Education',
    description:
        'Become a better investor. Plain-English guides to recessions, inflation, the Fed, ETFs, dividends, bonds, bubbles and more — each linked to FeedCast’s live tools.',
};

const VALID = new Set<string>(CATEGORIES.map((c) => c.id));

export default async function LearnPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const { category } = await searchParams;
    const active = category && VALID.has(category) ? (category as CategoryId) : null;

    const list = active ? ARTICLES.filter((a) => a.category === active) : ARTICLES;
    const [featured, ...rest] = list;

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            {/* Hero */}
            <header className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-teal-500/10 via-gray-900/40 to-gray-900/40 p-6 md:p-8">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <GraduationCap className="text-teal-400" /> Learn
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300 md:text-base">
                    Investment education is the foundation of investing success. Build a real
                    understanding of the economics, markets and strategies the professionals use —
                    each guide in plain English, and linked to the live FeedCast tools where you can
                    put it to work.
                </p>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Category rail */}
                <aside className="lg:w-56 lg:shrink-0">
                    <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Categories
                    </p>
                    <nav className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
                        <CatLink href="/learn" label="All Categories" on={!active} />
                        {CATEGORIES.map((c) => (
                            <CatLink
                                key={c.id}
                                href={`/learn?category=${c.id}`}
                                label={c.label}
                                on={active === c.id}
                                accent={c.text}
                            />
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    {active && (
                        <p className="mb-3 text-sm text-gray-400">
                            <span className={cn('font-semibold', getCategory(active).text)}>
                                {getCategory(active).label}
                            </span>{' '}
                            — {getCategory(active).blurb}
                        </p>
                    )}

                    {featured && (
                        <div className="mb-4">
                            <ArticleCard article={featured} featured />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {rest.map((a) => (
                            <ArticleCard key={a.slug} article={a} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CatLink({ href, label, on, accent }: { href: string; label: string; on: boolean; accent?: string }) {
    return (
        <Link
            href={href}
            className={cn(
                'rounded-lg px-3 py-2 text-sm transition-colors',
                on ? cn('bg-gray-800/70 font-semibold', accent ?? 'text-teal-400') : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            )}
        >
            {label}
        </Link>
    );
}

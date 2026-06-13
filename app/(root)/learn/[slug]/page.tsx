import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Lightbulb, ArrowRight, Compass } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import ArticleCard from '@/components/learn/ArticleCard';
import { ARTICLES, getArticle, getCategory, articlesByCategory, type Block } from '@/lib/learn';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
    return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const a = getArticle(slug);
    if (!a) return { title: 'Learn' };
    return { title: `${a.title} — Learn`, description: a.excerpt };
}

function Content({ block }: { block: Block }) {
    switch (block.k) {
        case 'h':
            return <h2 className="mt-7 text-xl font-bold text-gray-100">{block.text}</h2>;
        case 'p':
            return <p className="mt-3 leading-relaxed text-gray-300">{block.text}</p>;
        case 'list':
            return (
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed text-gray-300 marker:text-gray-600">
                    {block.items.map((it) => (
                        <li key={it}>{it}</li>
                    ))}
                </ul>
            );
        case 'note':
            return (
                <div className="mt-5 rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-4">
                    <p className="text-sm font-semibold text-teal-300">{block.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-300">{block.text}</p>
                </div>
            );
    }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) notFound();

    const cat = getCategory(article.category);
    const Icon = cat.icon;
    const related = articlesByCategory(article.category).filter((a) => a.slug !== article.slug).slice(0, 3);

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <article className="mx-auto w-full max-w-3xl">
                <Link href={`/learn?category=${article.category}`} className="flex w-fit items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-teal-400">
                    <ArrowLeft size={13} /> {cat.label}
                </Link>

                {/* Header */}
                <div className={cn('mt-3 flex items-center justify-center rounded-2xl bg-gradient-to-br', cat.grad, 'h-40')}>
                    <Icon className={cn('h-14 w-14', cat.text)} strokeWidth={1.5} />
                </div>

                <div className="mt-5 flex items-center gap-2">
                    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cat.chip)}>
                        {cat.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock size={12} /> {article.readMin} min read
                    </span>
                </div>

                <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-100">{article.title}</h1>
                <p className="mt-2 text-base leading-relaxed text-gray-400">{article.excerpt}</p>

                <div className="mt-6 border-t border-gray-800 pt-2">
                    {article.body.map((b, i) => (
                        <Content key={i} block={b} />
                    ))}
                </div>

                {/* Key takeaways */}
                <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/60 p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-100">
                        <Lightbulb size={16} className="text-amber-400" /> Key takeaways
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                        {article.takeaways.map((t) => (
                            <li key={t} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                                <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', cat.dot)} />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Explore on FeedCast — cross-links to live tools */}
                {article.tools && article.tools.length > 0 && (
                    <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
                        <p className="flex items-center gap-2 text-sm font-bold text-gray-100">
                            <Compass size={16} className="text-teal-400" /> Put it to work on FeedCast
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {article.tools.map((t) => (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:border-teal-400/50 hover:text-teal-300"
                                >
                                    {t.label}
                                    <ArrowRight size={14} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <DataDisclaimer className="mt-6 w-fit" />
            </article>

            {/* Related */}
            {related.length > 0 && (
                <section className="mx-auto w-full max-w-5xl">
                    <h2 className="mb-3 text-lg font-semibold text-gray-100">More in {cat.label}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((a) => (
                            <ArticleCard key={a.slug} article={a} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

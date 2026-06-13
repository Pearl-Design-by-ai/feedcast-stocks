import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { getCategory, type Article } from '@/lib/learn';
import LearnArt from '@/components/learn/LearnArt';
import { cn } from '@/lib/utils';

/** Article card — a topic-specific hand-drawn SVG scene over the category gradient. */
export default function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
    const cat = getCategory(article.category);
    return (
        <Link
            href={`/learn/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 transition-colors hover:border-gray-700 hover:bg-gray-900/70"
        >
            <div className={cn('relative overflow-hidden bg-gradient-to-br', cat.grad, featured ? 'h-48' : 'h-32')}>
                {/* Subtle dotted texture for depth */}
                <div
                    className="absolute inset-0 opacity-[0.25]"
                    style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: 'rgba(255,255,255,0.12)' }}
                />
                <div className={cn('absolute inset-0 p-3 transition-transform duration-300 group-hover:scale-[1.04]', cat.text)}>
                    <LearnArt slug={article.slug} category={article.category} />
                </div>
                <span className={cn('absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cat.chip)}>
                    {cat.label}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className={cn('font-bold text-gray-100 group-hover:text-white', featured ? 'text-xl' : 'text-base')}>
                    {article.title}
                </h3>
                <p className={cn('mt-1 flex-1 text-sm leading-relaxed text-gray-400', featured ? '' : 'line-clamp-3')}>
                    {article.excerpt}
                </p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock size={12} /> {article.readMin} min read
                    </span>
                    <span className={cn('flex items-center gap-1 text-xs font-semibold', cat.text)}>
                        Read <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

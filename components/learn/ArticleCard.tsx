import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { getCategory, type Article } from '@/lib/learn';
import { cn } from '@/lib/utils';

/** Article card — gradient icon header (no stock photos), category chip, excerpt. */
export default function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
    const cat = getCategory(article.category);
    const Icon = cat.icon;
    return (
        <Link
            href={`/learn/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 transition-colors hover:border-gray-700 hover:bg-gray-900/70"
        >
            <div className={cn('relative flex items-center justify-center bg-gradient-to-br', cat.grad, featured ? 'h-44' : 'h-28')}>
                <Icon className={cn(cat.text, featured ? 'h-12 w-12' : 'h-9 w-9')} strokeWidth={1.5} />
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

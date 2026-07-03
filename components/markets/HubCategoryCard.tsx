import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Directory-hub category card — an original SVG scene over the category
 * gradient, in the Learn article-card grammar. Shared by the ETF Hub and
 * Stock Hub landing pages.
 */
export default function HubCategoryCard({
    href,
    label,
    blurb,
    countLabel,
    samples,
    accent,
    art,
}: {
    href: string;
    label: string;
    blurb: string;
    /** Chip text, e.g. "42 ETFs" / "38 stocks". */
    countLabel: string;
    /** A few example tickers teased under the blurb. */
    samples: string[];
    accent: { text: string; chip: string; grad: string };
    art: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 transition-colors hover:border-gray-700 hover:bg-gray-900/70"
        >
            <div className={cn('relative h-36 overflow-hidden bg-gradient-to-br', accent.grad)}>
                <div
                    className="absolute inset-0 opacity-[0.25]"
                    style={{
                        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                        color: 'rgba(255,255,255,0.12)',
                    }}
                />
                <div className={cn('absolute inset-0 p-3 transition-transform duration-300 group-hover:scale-[1.04]', accent.text)}>
                    {art}
                </div>
                <span className={cn('absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', accent.chip)}>
                    {countLabel}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-bold text-gray-100 group-hover:text-white">{label}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-400">{blurb}</p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium tracking-wide text-gray-500 tabular-nums">
                        {samples.join(' · ')} …
                    </span>
                    <span className={cn('flex items-center gap-1 text-xs font-semibold', accent.text)}>
                        Browse <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

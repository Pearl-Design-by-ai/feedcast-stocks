/**
 * "What to examine next" — a compact row of onward links that turns an isolated
 * page into a step in a flow. Research pages should lead into monitoring and
 * workflow actions (watchlist / alerts / screener / compare), and dashboards
 * should point back to the analytical reads that frame them.
 *
 * Server-component friendly (plain links). Pass 2–4 destinations.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface RelatedLink {
    href: string;
    label: string;
    /** One short phrase on why you'd go there next. */
    desc?: string;
}

export default function RelatedLinks({
    items,
    title = 'What to examine next',
    className = '',
}: {
    items: RelatedLink[];
    title?: string;
    className?: string;
}) {
    if (!items.length) return null;
    return (
        <section className={`rounded-xl border border-gray-800 bg-gray-900/40 p-4 ${className}`}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((it) => (
                    <Link
                        key={it.href + it.label}
                        href={it.href}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2.5 transition-colors hover:border-teal-400/40"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-100 group-hover:text-teal-300">{it.label}</p>
                            {it.desc && <p className="truncate text-xs text-gray-500">{it.desc}</p>}
                        </div>
                        <ArrowRight size={15} className="shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-400" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

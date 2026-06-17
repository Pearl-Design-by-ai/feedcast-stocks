/**
 * Learn — a self-contained financial-education library. Content is evergreen
 * and written in-house (no live data, nothing fabricated), organized by
 * category, with cross-links into FeedCast's live tools so reading flows into
 * doing. Rendered by /learn (hub) and /learn/[slug] (article).
 */

import type { LucideIcon } from 'lucide-react';
import {
    GraduationCap,
    Landmark,
    LayoutGrid,
    Coins,
    Receipt,
    ShieldAlert,
} from 'lucide-react';

export type CategoryId = 'basics' | 'economics' | 'etfs' | 'dividends' | 'bonds' | 'risk';

export interface Category {
    id: CategoryId;
    label: string;
    blurb: string;
    icon: LucideIcon;
    /** Static accent classes — one identity per category. */
    text: string;
    chip: string;
    grad: string; // gradient for the card/hero icon tile
    dot: string; // solid accent for list markers
}

export const CATEGORIES: Category[] = [
    {
        id: 'basics',
        label: 'Investing Basics',
        blurb: 'The foundations every investor should own.',
        icon: GraduationCap,
        text: 'text-teal-400',
        chip: 'bg-teal-400/10 text-teal-400',
        grad: 'from-teal-500/30 to-teal-500/5',
        dot: 'bg-teal-400',
    },
    {
        id: 'economics',
        label: 'Economics & Macro',
        blurb: 'Recessions, inflation, the Fed — the big forces.',
        icon: Landmark,
        text: 'text-amber-400',
        chip: 'bg-amber-400/10 text-amber-400',
        grad: 'from-amber-500/30 to-amber-500/5',
        dot: 'bg-amber-400',
    },
    {
        id: 'etfs',
        label: 'ETFs & Funds',
        blurb: 'Funds, index investing and what you really pay.',
        icon: LayoutGrid,
        text: 'text-sky-400',
        chip: 'bg-sky-400/10 text-sky-400',
        grad: 'from-sky-500/30 to-sky-500/5',
        dot: 'bg-sky-400',
    },
    {
        id: 'dividends',
        label: 'Dividends & Income',
        blurb: 'Getting paid to hold — yield, growth, payout.',
        icon: Coins,
        text: 'text-emerald-400',
        chip: 'bg-emerald-400/10 text-emerald-400',
        grad: 'from-emerald-500/30 to-emerald-500/5',
        dot: 'bg-emerald-400',
    },
    {
        id: 'bonds',
        label: 'Bonds & Rates',
        blurb: 'Fixed income, duration and the price-yield seesaw.',
        icon: Receipt,
        text: 'text-violet-400',
        chip: 'bg-violet-400/10 text-violet-400',
        grad: 'from-violet-500/30 to-violet-500/5',
        dot: 'bg-violet-400',
    },
    {
        id: 'risk',
        label: 'Risk & Strategy',
        blurb: 'Bubbles, position sizing and surviving drawdowns.',
        icon: ShieldAlert,
        text: 'text-rose-400',
        chip: 'bg-rose-400/10 text-rose-400',
        grad: 'from-rose-500/30 to-rose-500/5',
        dot: 'bg-rose-400',
    },
];

export function getCategory(id: CategoryId): Category {
    return CATEGORIES.find((c) => c.id === id)!;
}

export type Block =
    | { k: 'p'; text: string }
    | { k: 'h'; text: string }
    | { k: 'list'; items: string[] }
    | { k: 'note'; title: string; text: string };

export interface RelatedTool {
    label: string;
    href: string;
}

export interface Article {
    slug: string;
    title: string;
    category: CategoryId;
    excerpt: string;
    readMin: number;
    body: Block[];
    takeaways: string[];
    /** Links into FeedCast's live tools, so reading flows into doing. */
    tools?: RelatedTool[];
}

// ---------------------------------------------------------------------------
// Article accessors. The article DATA now lives in the PRIVATE markets-engine
// (fetched via lib/actions/learn.actions.ts); these operate on a fetched list.
// ---------------------------------------------------------------------------

export function getArticle(articles: Article[], slug: string): Article | undefined {
    return articles.find((a) => a.slug === slug);
}

export function articlesByCategory(articles: Article[], id: CategoryId): Article[] {
    return articles.filter((a) => a.category === id);
}


/** Shared building blocks for the /my-portfolio tabs (server components). */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/private-portfolio/types';

export const TABS = [
    { id: 'overview', label: 'Genel bakış' },
    { id: 'compare', label: 'Öneri vs Mevcut' },
    { id: 'income', label: 'Gelir' },
    { id: 'scenarios', label: 'Senaryo & Drawdown' },
    { id: 'documents', label: 'Belgeler' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export const isTabId = (v: unknown): v is TabId => TABS.some((t) => t.id === v);

export function hrefFor(tab: TabId, plan?: string | null) {
    const q = new URLSearchParams({ tab });
    if (plan) q.set('plan', plan);
    return `/my-portfolio?${q.toString()}`;
}

/** The shared card grammar — rounded-xl + bg-gray-900/… keeps the load-in rise. */
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return <section className={cn('rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5', className)}>{children}</section>;
}

export function CardTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-100">{children}</h2>
            {aside && <div className="text-xs text-gray-500">{aside}</div>}
        </div>
    );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: React.ReactNode; tone?: 'up' | 'down' }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className={cn('mt-1 text-xl font-bold tabular-nums md:text-2xl', tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-gray-100')}>
                {value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
    );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
    return <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-8 text-center text-sm text-gray-500">{children}</div>;
}

export function TabNav({ active, plan }: { active: TabId; plan?: string | null }) {
    return (
        <nav aria-label="Portföy sekmeleri" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="flex w-max min-w-full gap-1.5 border-b border-gray-800 pb-px">
                {TABS.map((t) => {
                    const on = t.id === active;
                    return (
                        <Link
                            key={t.id}
                            href={hrefFor(t.id, plan)}
                            aria-current={on ? 'page' : undefined}
                            className={cn(
                                'whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
                                on ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                            )}
                        >
                            {t.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function PlanPicker({ plans, active, tab }: { plans: Plan[]; active: Plan; tab: TabId }) {
    if (plans.length < 2) return null;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Plan:</span>
            {plans.map((p) => {
                const on = p.slug === active.slug;
                return (
                    <Link
                        key={p.slug}
                        href={hrefFor(tab, p.slug)}
                        aria-current={on ? 'true' : undefined}
                        className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            on ? 'border-teal-400/60 bg-teal-400/10 text-teal-400' : 'border-gray-700 text-gray-400 hover:text-gray-200'
                        )}
                    >
                        {p.title}
                    </Link>
                );
            })}
        </div>
    );
}

export function BulletList({ title, items }: { title: string; items?: string[] }) {
    if (!items?.length) return null;
    return (
        <Card>
            <CardTitle>{title}</CardTitle>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-400">
                {items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ul>
        </Card>
    );
}

export const deltaTone = (n: number): 'up' | 'down' | undefined => (n > 0 ? 'up' : n < 0 ? 'down' : undefined);

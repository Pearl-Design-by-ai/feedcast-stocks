'use client';

/**
 * Strategy Explorer — market-view filter + sortable comparison matrix +
 * expandable per-strategy cards. Every payoff figure (max profit/loss,
 * break-evens, net debit, Greek signs) is computed from the strategy's legs at a
 * canonical scenario, so the matrix and cards always agree. Educational only.
 */

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import PayoffChart from './PayoffChart';
import { STRATEGIES, VIEW_LABELS, type Strategy, type View, type Difficulty } from '@/lib/options/strategies';
import { priceLegs, analyze, type PayoffStats, type Scenario } from '@/lib/options/payoff';

const SCENARIO: Scenario = { spot: 100, vol: 0.3, days: 30, rate: 0.04 };

const DIFF_COLOR: Record<Difficulty, string> = {
    Beginner: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
    Intermediate: 'bg-teal-500/10 text-teal-300 ring-teal-400/30',
    Advanced: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
    Professional: 'bg-red-500/10 text-red-300 ring-red-400/30',
};
const RISK_LABEL = ['', 'Low', 'Low–Med', 'Medium', 'High', 'Very High'];

const money = (perShare: number | null): string =>
    perShare === null ? 'Unlimited' : `${perShare < 0 ? '−' : ''}$${Math.abs(Math.round(perShare * 100)).toLocaleString()}`;

interface Row {
    s: Strategy;
    stats: PayoffStats | null;
    capital: number | null; // per-share; null = high/undefined
}

function capitalFor(stats: PayoffStats | null): number | null {
    if (!stats) return null;
    if (stats.maxLoss === null) return null; // undefined risk → margin
    if (stats.netDebit > 0) return stats.netDebit; // debit paid
    return Math.abs(stats.maxLoss); // defined-risk credit trade
}

type SortKey = 'name' | 'risk' | 'maxProfit' | 'maxLoss' | 'difficulty';
const DIFF_ORDER: Record<Difficulty, number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Professional: 3 };

export default function StrategyExplorer() {
    const [view, setView] = useState<View | 'all'>('all');
    const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'difficulty', dir: 'asc' });
    const [open, setOpen] = useState<Set<string>>(new Set());

    const toggleCard = (slug: string) =>
        setOpen((p) => {
            const n = new Set(p);
            if (n.has(slug)) n.delete(slug);
            else n.add(slug);
            return n;
        });

    /** Open the card and scroll to it — used by the matrix strategy links. */
    const openCard = (slug: string) => {
        setOpen((p) => new Set(p).add(slug));
        requestAnimationFrame(() =>
            document.getElementById(`strat-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        );
    };

    const rows = useMemo<Row[]>(() => {
        return STRATEGIES.map((s) => {
            if (s.noPayoff) return { s, stats: null, capital: null };
            const legs = priceLegs(s.build(SCENARIO.spot), SCENARIO);
            const stats = analyze(legs, SCENARIO);
            return { s, stats, capital: capitalFor(stats) };
        });
    }, []);

    const filtered = useMemo(() => {
        const f = view === 'all' ? rows : rows.filter((r) => r.s.views.includes(view));
        const dir = sort.dir === 'asc' ? 1 : -1;
        const val = (r: Row): number | string => {
            switch (sort.key) {
                case 'name': return r.s.name;
                case 'risk': return r.s.risk;
                case 'difficulty': return DIFF_ORDER[r.s.difficulty];
                case 'maxProfit': return r.stats?.maxProfit ?? Number.POSITIVE_INFINITY;
                case 'maxLoss': return r.stats?.maxLoss ?? Number.NEGATIVE_INFINITY;
            }
        };
        return [...f].sort((a, b) => {
            const va = val(a);
            const vb = val(b);
            if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir;
            return ((va as number) - (vb as number)) * dir;
        });
    }, [rows, view, sort]);

    const toggleSort = (key: SortKey) =>
        setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

    return (
        <div className="flex flex-col gap-5">
            {/* Market-view filter */}
            <div className="flex flex-wrap gap-1.5">
                <FilterChip active={view === 'all'} onClick={() => setView('all')}>All strategies</FilterChip>
                {VIEW_LABELS.map((v) => (
                    <FilterChip key={v.id} active={view === v.id} onClick={() => setView(v.id)}>{v.label}</FilterChip>
                ))}
            </div>

            {/* Comparison matrix */}
            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
                <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="border-b border-gray-800 bg-white/5 text-gray-400">
                        <tr>
                            <Th label="Strategy" k="name" sort={sort} onSort={toggleSort} />
                            <th className="px-3 py-3 font-semibold">Market</th>
                            <th className="px-3 py-3 font-semibold">Volatility</th>
                            <Th label="Max profit" k="maxProfit" sort={sort} onSort={toggleSort} align="right" />
                            <Th label="Max loss" k="maxLoss" sort={sort} onSort={toggleSort} align="right" />
                            <th className="px-3 py-3 text-right font-semibold">Capital</th>
                            <Th label="Risk" k="risk" sort={sort} onSort={toggleSort} />
                            <th className="px-3 py-3 font-semibold">Tags</th>
                            <Th label="Level" k="difficulty" sort={sort} onSort={toggleSort} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/70">
                        {filtered.map(({ s, stats, capital }) => (
                            <tr key={s.slug} className="hover:bg-white/5">
                                <td className="px-3 py-3 font-medium">
                                    <button
                                        type="button"
                                        onClick={() => openCard(s.slug)}
                                        className="text-left text-gray-100 transition-colors hover:text-teal-300 hover:underline"
                                        title={`Jump to ${s.name} details`}
                                    >
                                        {s.name}
                                    </button>
                                </td>
                                <td className="px-3 py-3 text-gray-400">{s.marketView}</td>
                                <td className="px-3 py-3 text-gray-400">{s.volView}</td>
                                <td className={cn('px-3 py-3 text-right tabular-nums', stats?.maxProfit === null ? 'text-emerald-400 font-semibold' : 'text-gray-200')}>
                                    {stats ? money(stats.maxProfit) : '—'}
                                </td>
                                <td className={cn('px-3 py-3 text-right tabular-nums', stats?.maxLoss === null ? 'text-red-400 font-semibold' : 'text-gray-200')}>
                                    {stats ? money(stats.maxLoss) : '—'}
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-gray-300">{capital === null ? 'High' : `$${Math.round(capital * 100).toLocaleString()}`}</td>
                                <td className="px-3 py-3 text-gray-400">{RISK_LABEL[s.risk]}</td>
                                <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {s.income && <MiniTag tone="teal">Income</MiniTag>}
                                        {s.hedge && <MiniTag tone="blue">Hedge</MiniTag>}
                                    </div>
                                </td>
                                <td className="px-3 py-3">
                                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', DIFF_COLOR[s.difficulty])}>
                                        {s.difficulty}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="-mt-2 text-[11px] text-gray-600">
                Figures are per 1 contract (×100 shares) at a model scenario: $100 underlying, 30% IV, 30 days, 4% rate. Real
                prices vary with the actual chain.
            </p>

            {/* Strategy cards */}
            <div className="flex flex-col gap-2.5">
                {filtered.map(({ s, stats, capital }) => {
                    const isOpen = open.has(s.slug);
                    return (
                    <div key={s.slug} id={`strat-${s.slug}`} className="scroll-mt-28 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40">
                        <button
                            type="button"
                            onClick={() => toggleCard(s.slug)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between gap-3 p-4 text-left md:p-5"
                        >
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-100">{s.name}</span>
                                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', DIFF_COLOR[s.difficulty])}>{s.difficulty}</span>
                                <span className="text-xs text-gray-500">{s.marketView}</span>
                                {s.income && <MiniTag tone="teal">Income</MiniTag>}
                                {s.hedge && <MiniTag tone="blue">Hedge</MiniTag>}
                            </div>
                            <ChevronDown size={18} className={cn('shrink-0 text-gray-500 transition-transform duration-200', isOpen && 'rotate-180')} />
                        </button>
                        {isOpen && (
                        <div className="px-4 pb-4 md:px-5 md:pb-5">
                        <p className="text-sm leading-relaxed text-gray-300">{s.summary}</p>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            {/* Left: payoff + key numbers */}
                            <div>
                                {stats ? (
                                    <>
                                        <PayoffChart curve={stats.curve} breakevens={stats.breakevens} spot={SCENARIO.spot} height={200} />
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                            <Stat label="Max profit" value={money(stats.maxProfit)} tone={stats.maxProfit === null ? 'pos' : undefined} />
                                            <Stat label="Max loss" value={money(stats.maxLoss)} tone={stats.maxLoss === null ? 'neg' : undefined} />
                                            <Stat label="Break-even" value={stats.breakevens.length ? stats.breakevens.map((b) => b.toFixed(0)).join(' / ') : '—'} />
                                            <Stat label={stats.netDebit >= 0 ? 'Net debit' : 'Net credit'} value={`$${Math.abs(Math.round(stats.netDebit * 100)).toLocaleString()}`} />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                                            <span>Δ {stats.greeks.delta.toFixed(2)}</span>
                                            <span>Θ {stats.greeks.theta >= 0 ? '+' : ''}{(stats.greeks.theta * 100).toFixed(0)}/day</span>
                                            <span>V {stats.greeks.vega >= 0 ? '+' : ''}{(stats.greeks.vega * 100).toFixed(0)}/IV pt</span>
                                            <span>Capital {capital === null ? 'High/undefined' : `$${Math.round(capital * 100).toLocaleString()}`}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
                                        A time spread across two expirations — its payoff depends on both, so no single-expiry diagram is shown.
                                    </div>
                                )}
                            </div>

                            {/* Right: details */}
                            <div className="flex flex-col gap-3 text-[13px]">
                                <Detail label="Construction">{s.construction.join(' · ')}</Detail>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <BulletList title="Advantages" items={s.advantages} tone="pos" />
                                    <BulletList title="Disadvantages" items={s.disadvantages} tone="neg" />
                                </div>
                                <BulletList title="Common mistakes" items={s.mistakes} tone="warn" />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-gray-400">
                                    <Detail label="Best environment">{s.bestEnv}</Detail>
                                    <Detail label="Worst environment">{s.worstEnv}</Detail>
                                    <Detail label="Assignment risk">{s.assignment}</Detail>
                                    <Detail label="Time decay">{s.timeDecay}</Detail>
                                </div>
                            </div>
                        </div>
                        </div>
                        )}
                    </div>
                    );
                })}
            </div>
        </div>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                active ? 'border-teal-400/40 bg-teal-500/15 text-teal-300' : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:text-gray-200'
            )}
        >
            {children}
        </button>
    );
}

function Th({ label, k, sort, onSort, align = 'left' }: { label: string; k: SortKey; sort: { key: SortKey; dir: 'asc' | 'desc' }; onSort: (k: SortKey) => void; align?: 'left' | 'right' }) {
    const active = sort.key === k;
    return (
        <th className={cn('px-3 py-3 font-semibold', align === 'right' && 'text-right')}>
            <button type="button" onClick={() => onSort(k)} className={cn('inline-flex items-center gap-1 hover:text-white', active && 'text-white')}>
                {label}
                <span className="text-[10px] text-gray-600">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
            </button>
        </th>
    );
}

function MiniTag({ children, tone }: { children: React.ReactNode; tone: 'teal' | 'blue' }) {
    return (
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', tone === 'teal' ? 'bg-teal-500/10 text-teal-300' : 'bg-blue-500/10 text-blue-300')}>
            {children}
        </span>
    );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className={cn('font-semibold tabular-nums', tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-gray-200')}>{value}</p>
        </div>
    );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-0.5 text-gray-300">{children}</p>
        </div>
    );
}

function BulletList({ title, items, tone }: { title: string; items: string[]; tone: 'pos' | 'neg' | 'warn' }) {
    const dot = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-amber-400';
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
            <ul className="mt-1 flex flex-col gap-1">
                {items.map((it) => (
                    <li key={it} className="flex gap-1.5 text-xs text-gray-400">
                        <span className={dot}>•</span>
                        <span>{it}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

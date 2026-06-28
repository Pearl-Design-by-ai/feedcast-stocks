'use client';

/**
 * Interactive payoff simulator. Pick a strategy and dial in the underlying,
 * volatility, days to expiry, rate and contract count; legs are priced with
 * Black–Scholes and the payoff/Greeks recomputed live. Educational model —
 * premiums are theoretical, not live chain quotes.
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import PayoffChart from './PayoffChart';
import { STRATEGIES } from '@/lib/options/strategies';
import { priceLegs, analyze, type Scenario } from '@/lib/options/payoff';

const PLAYABLE = STRATEGIES.filter((s) => !s.noPayoff);

export default function Simulator() {
    const [slug, setSlug] = useState('bull-call-spread');
    const [spot, setSpot] = useState(100);
    const [vol, setVol] = useState(30); // %
    const [days, setDays] = useState(30);
    const [rate, setRate] = useState(4); // %
    const [contracts, setContracts] = useState(1);

    const strat = STRATEGY(slug);
    const scenario: Scenario = { spot, vol: vol / 100, days, rate: rate / 100 };

    const { stats, legs } = useMemo(() => {
        const built = priceLegs(strat.build(spot), scenario);
        return { stats: analyze(built, scenario), legs: built };
    }, [strat, spot, vol, days, rate]); // eslint-disable-line react-hooks/exhaustive-deps

    const dollars = (perShare: number | null): string =>
        perShare === null ? 'Unlimited' : `${perShare < 0 ? '−' : ''}$${Math.abs(Math.round(perShare * 100 * contracts)).toLocaleString()}`;

    const capital = stats.maxLoss === null ? null : stats.netDebit > 0 ? stats.netDebit : Math.abs(stats.maxLoss);
    const rr =
        stats.maxProfit !== null && stats.maxLoss !== null && stats.maxLoss !== 0
            ? Math.abs(stats.maxProfit / stats.maxLoss)
            : null;

    return (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            {/* Inputs */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Strategy</label>
                    <select
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none"
                    >
                        {PLAYABLE.map((s) => (
                            <option key={s.slug} value={s.slug}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <Slider label="Underlying price" value={spot} min={10} max={500} step={1} onChange={setSpot} fmt={(v) => `$${v}`} />
                <Slider label="Implied volatility" value={vol} min={5} max={120} step={1} onChange={setVol} fmt={(v) => `${v}%`} />
                <Slider label="Days to expiration" value={days} min={1} max={365} step={1} onChange={setDays} fmt={(v) => `${v}d`} />
                <Slider label="Risk-free rate" value={rate} min={0} max={10} step={0.25} onChange={setRate} fmt={(v) => `${v}%`} />
                <Slider label="Contracts" value={contracts} min={1} max={50} step={1} onChange={setContracts} fmt={(v) => `${v}`} />

                <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Legs (priced)</p>
                    <ul className="flex flex-col gap-0.5 text-xs text-gray-400">
                        {legs.map((l, i) => (
                            <li key={i} className="flex justify-between tabular-nums">
                                <span>
                                    {(l.qty ?? 1) > 1 ? `${l.qty}× ` : ''}{l.dir === 'long' ? 'Long' : 'Short'} {l.type}
                                    {l.type !== 'stock' && l.strike != null ? ` ${l.strike}` : ''}
                                </span>
                                <span className="text-gray-500">${(l.premium ?? 0).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Output */}
            <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <PayoffChart curve={stats.curve} breakevens={stats.breakevens} spot={spot} height={280} />
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    <Out label="Max profit" value={dollars(stats.maxProfit)} tone={stats.maxProfit === null ? 'pos' : undefined} />
                    <Out label="Max loss" value={dollars(stats.maxLoss)} tone={stats.maxLoss === null ? 'neg' : undefined} />
                    <Out label="Break-even" value={stats.breakevens.length ? stats.breakevens.map((b) => b.toFixed(1)).join(' / ') : '—'} />
                    <Out label={stats.netDebit >= 0 ? 'Net debit' : 'Net credit'} value={`$${Math.abs(Math.round(stats.netDebit * 100 * contracts)).toLocaleString()}`} />
                    <Out label="Capital req." value={capital === null ? 'High / margin' : `$${Math.round(capital * 100 * contracts).toLocaleString()}`} />
                    <Out label="Risk / reward" value={rr === null ? '—' : `1 : ${rr.toFixed(2)}`} />
                    <Out label="Net delta" value={(stats.greeks.delta * contracts).toFixed(2)} />
                    <Out label="Theta / day" value={`${stats.greeks.theta >= 0 ? '+' : '−'}$${Math.abs(Math.round(stats.greeks.theta * 100 * contracts))}`} tone={stats.greeks.theta >= 0 ? 'pos' : 'neg'} />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 text-xs text-gray-400">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Estimated Greeks (per position)</span>
                    <span>Δ {(stats.greeks.delta * contracts).toFixed(2)}</span>
                    <span>Γ {(stats.greeks.gamma * contracts).toFixed(3)}</span>
                    <span>Θ {(stats.greeks.theta * 100 * contracts).toFixed(0)}/day</span>
                    <span>V {(stats.greeks.vega * 100 * contracts).toFixed(0)}/IV pt</span>
                    <span>Ρ {(stats.greeks.rho * 100 * contracts).toFixed(0)}/rate pt</span>
                </div>
                <p className="text-[11px] text-gray-600">
                    Premiums are Black–Scholes estimates (no dividends, European-style), not live quotes. Probability and margin
                    are model approximations. Educational only — not investment advice.
                </p>
            </div>
        </div>
    );
}

function STRATEGY(slug: string) {
    return PLAYABLE.find((s) => s.slug === slug) ?? PLAYABLE[0];
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
                <span className="text-xs font-semibold tabular-nums text-teal-300">{fmt(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 w-full accent-teal-400" />
        </div>
    );
}

function Out({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className={cn('mt-0.5 text-sm font-bold tabular-nums', tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-gray-100')}>{value}</p>
        </div>
    );
}

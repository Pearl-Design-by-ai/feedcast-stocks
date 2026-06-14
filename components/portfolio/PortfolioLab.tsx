'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    PieChart, Sparkles, Loader2, Copy, Check, Plus, Briefcase, TrendingUp, ShieldCheck, Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buildPortfolio, entryPlan, type PortfolioInputs, type PortfolioPlan, type Holding } from '@/lib/portfolio/engine';
import { priceBasket, getPortfolioReturns, type BacktestRow } from '@/lib/actions/portfolio.actions';
import { createGroup, addSymbolsToGroup } from '@/lib/actions/watchlist-groups.actions';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'TRY'];

function Seg<T extends string>({ value, opts, onChange }: { value: T; opts: { v: T; label: string }[]; onChange: (v: T) => void }) {
    return (
        <div className="inline-flex flex-wrap overflow-hidden rounded-lg border border-gray-700">
            {opts.map((o, i) => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v)}
                    className={cn(
                        'px-3 py-1.5 text-sm font-medium transition-colors',
                        i > 0 && 'border-l border-gray-700',
                        value === o.v ? 'bg-teal-500/15 text-teal-300' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
            {children}
        </div>
    );
}

const ARCH_ICON = { growth: Rocket, income: TrendingUp, conservative: ShieldCheck, thematic: Sparkles };

const fmtMoney = (v: number, ccy: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(v);

const CODE = `// Turn target weights into approximate share counts.
// Plug in live prices (broker/API) and extend from here.
export interface Holding { ticker: string; weight: number } // weight = %

export function deployCapital(
  holdings: Holding[],
  capital: number,
  prices: Record<string, number>,
) {
  return holdings.map((h) => {
    const value = (h.weight / 100) * capital;
    const px = prices[h.ticker];
    return { ...h, value: Math.round(value), price: px ?? null, shares: px ? Math.floor(value / px) : null };
  });
}

// Allocation by sector/region for a quick risk read:
export function allocationBy<T extends { weight: number }>(rows: T[], key: keyof T) {
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r[key])] = (out[String(r[key])] ?? 0) + r.weight;
  return out;
}`;

export default function PortfolioLab() {
    const [inp, setInp] = useState<PortfolioInputs>({
        currency: 'USD', capital: 50000, horizon: 'long', risk: 'high', bias: 'growth', theme: 'ai',
        universe: 'us', sectorCap: 35, singleNameMax: 10, vehicle: 'mixed', concentration: 'balanced',
    });
    const [plan, setPlan] = useState<PortfolioPlan | null>(null);
    const [builtInp, setBuiltInp] = useState<PortfolioInputs | null>(null);
    const [prices, setPrices] = useState<Record<string, number | null> | null>(null);
    const [pricing, setPricing] = useState(false);
    const [backtest, setBacktest] = useState<BacktestRow[] | null>(null);
    const [bting, setBting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const set = <K extends keyof PortfolioInputs>(k: K, v: PortfolioInputs[K]) => setInp((p) => ({ ...p, [k]: v }));

    const build = () => {
        setPrices(null);
        setBacktest(null);
        setBuiltInp(inp);
        setPlan(buildPortfolio(inp));
    };

    const runBacktest = async () => {
        if (!plan) return;
        setBting(true);
        try {
            const res = await getPortfolioReturns(plan.holdings.map((h) => ({ ticker: h.ticker, weight: h.weight, sleeve: h.sleeve })));
            setBacktest(res.rows);
        } finally {
            setBting(false);
        }
    };

    const used = builtInp ?? inp;

    const deploy = async () => {
        if (!plan) return;
        setPricing(true);
        try {
            setPrices(await priceBasket(plan.holdings.map((h) => h.ticker)));
        } finally {
            setPricing(false);
        }
    };

    const save = async () => {
        if (!plan) return;
        const tickers = plan.holdings.filter((h) => h.sleeve !== 'cash').map((h) => h.ticker);
        setSaving(true);
        try {
            const name = `${plan.archetype[0].toUpperCase()}${plan.archetype.slice(1)} Lab`;
            const res = await createGroup(name);
            if (!res.ok || !res.id) { toast.error(res.error ?? 'Could not create the list'); return; }
            const add = await addSymbolsToGroup(res.id, tickers.join(','));
            if (!add.ok) { toast.error('List created, but adding tickers failed'); return; }
            toast.success(`Saved ${add.added} tickers to “${name}” watchlist`);
        } finally {
            setSaving(false);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(CODE);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Copy failed');
        }
    };

    const ArchIcon = ARCH_ICON[inp.bias];

    return (
        <div className="space-y-6">
            {/* ---- Inputs (the parameter interrogation) ---- */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Briefcase size={16} className="text-teal-400" /> Mandate inputs
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Strategy bias">
                        <Seg value={inp.bias} onChange={(v) => set('bias', v)} opts={[
                            { v: 'growth', label: 'Growth' }, { v: 'income', label: 'Income' },
                            { v: 'conservative', label: 'Conservative' }, { v: 'thematic', label: 'Thematic' },
                        ]} />
                    </Field>
                    {inp.bias === 'thematic' && (
                        <Field label="Theme">
                            <Seg value={inp.theme} onChange={(v) => set('theme', v)} opts={[
                                { v: 'ai', label: 'AI' }, { v: 'fintech', label: 'Fintech' }, { v: 'em', label: 'EM' },
                                { v: 'energy', label: 'Clean energy' }, { v: 'healthcare', label: 'Healthcare' },
                            ]} />
                        </Field>
                    )}
                    <Field label="Risk tolerance">
                        <Seg value={inp.risk} onChange={(v) => set('risk', v)} opts={[
                            { v: 'low', label: 'Low' }, { v: 'medium', label: 'Medium' }, { v: 'high', label: 'High' },
                        ]} />
                    </Field>
                    <Field label="Time horizon">
                        <Seg value={inp.horizon} onChange={(v) => set('horizon', v)} opts={[
                            { v: 'short', label: '<3y' }, { v: 'medium', label: '3–7y' }, { v: 'long', label: '>7y' },
                        ]} />
                    </Field>
                    <Field label="Universe">
                        <select value={inp.universe} onChange={(e) => set('universe', e.target.value as PortfolioInputs['universe'])}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none">
                            <option value="us">US only</option>
                            <option value="dm">Global developed</option>
                            <option value="global">Global incl. EM</option>
                            <option value="em">Emerging markets</option>
                        </select>
                    </Field>
                    <Field label="Vehicles">
                        <Seg value={inp.vehicle} onChange={(v) => set('vehicle', v)} opts={[
                            { v: 'etf', label: 'ETF-heavy' }, { v: 'mixed', label: 'Mixed' }, { v: 'stock', label: 'Stock-heavy' },
                        ]} />
                    </Field>
                    <Field label="Concentration">
                        <Seg value={inp.concentration} onChange={(v) => set('concentration', v)} opts={[
                            { v: 'concentrated', label: '~12' }, { v: 'balanced', label: '~20' }, { v: 'diversified', label: '~30' },
                        ]} />
                    </Field>
                    <Field label="Base currency">
                        <select value={inp.currency} onChange={(e) => set('currency', e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none">
                            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Capital">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{inp.currency}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={inp.capital ? inp.capital.toLocaleString('en-US') : ''}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 12);
                                    set('capital', digits ? Number(digits) : 0);
                                }}
                                placeholder="50,000"
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-12 pr-3 text-sm tabular-nums text-gray-100 placeholder:text-gray-600 focus:border-teal-400/60 focus:outline-none" />
                        </div>
                    </Field>
                    <Field label={`Single-name max (${inp.singleNameMax}%)`}>
                        <input type="range" min={3} max={25} value={inp.singleNameMax} onChange={(e) => set('singleNameMax', Number(e.target.value))} className="accent-teal-400" />
                    </Field>
                    <Field label={`Sector cap (${inp.sectorCap}%)`}>
                        <input type="range" min={15} max={100} step={5} value={inp.sectorCap} onChange={(e) => set('sectorCap', Number(e.target.value))} className="accent-teal-400" />
                    </Field>
                </div>
                <button type="button" onClick={build}
                    className="mt-5 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400">
                    <ArchIcon size={16} /> Build portfolio
                </button>
            </section>

            {plan && (
                <>
                    {/* Mandate + design */}
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Mandate</h3>
                            <ul className="space-y-1.5 text-sm text-gray-300">
                                {plan.mandate.map((m, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/70" />{m}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Design</h3>
                            <ul className="space-y-1.5 text-sm text-gray-300">
                                {plan.design.map((m, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" />{m}</li>)}
                            </ul>
                        </div>
                    </section>

                    {/* Split bar */}
                    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                        <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1.5"><PieChart size={14} className="text-teal-400" /> Asset split</span>
                            <span>Equity {plan.equityPct}% · Bonds {plan.bondPct}% · Cash {plan.cashPct}%</span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-full">
                            <div className="bg-teal-500" style={{ width: `${plan.equityPct}%` }} />
                            <div className="bg-indigo-400" style={{ width: `${plan.bondPct}%` }} />
                            <div className="bg-gray-600" style={{ width: `${plan.cashPct}%` }} />
                        </div>
                    </section>

                    {/* Holdings */}
                    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Proposed holdings ({plan.holdings.length})</h3>
                            <div className="flex gap-2">
                                <button type="button" onClick={deploy} disabled={pricing}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-teal-400/40 hover:text-teal-300 disabled:opacity-50">
                                    {pricing ? <Loader2 size={13} className="animate-spin" /> : <PieChart size={13} />} Price &amp; deploy
                                </button>
                                <button type="button" onClick={save} disabled={saving}
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-50">
                                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Save as watchlist
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <th className="px-3 py-2">Ticker</th>
                                        <th className="px-3 py-2">Name &amp; rationale</th>
                                        <th className="px-3 py-2">Sector</th>
                                        <th className="px-3 py-2">Region</th>
                                        <th className="px-3 py-2">Role</th>
                                        <th className="px-3 py-2 text-right">Weight</th>
                                        {prices && <th className="px-3 py-2 text-right">Value</th>}
                                        {prices && <th className="px-3 py-2 text-right">~Shares</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.holdings.map((h) => <Row key={h.ticker} h={h} ccy={used.currency} capital={used.capital} price={prices?.[h.ticker]} showDeploy={!!prices} />)}
                                </tbody>
                            </table>
                        </div>
                        {prices && (
                            <p className="mt-2 text-[11px] text-gray-500">
                                Share counts are approximate, computed from last prices (USD) — FX vs {inp.currency} is not applied. Round lots and costs ignored.
                            </p>
                        )}
                    </section>

                    {/* Breakdowns */}
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Breakdown title="By sector" rows={plan.bySector} />
                        <Breakdown title="By region" rows={plan.byRegion} />
                    </section>

                    {/* Backtested returns */}
                    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Backtested returns</h3>
                            {!backtest && (
                                <button type="button" onClick={runBacktest} disabled={bting}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-teal-400/40 hover:text-teal-300 disabled:opacity-50">
                                    {bting ? <Loader2 size={13} className="animate-spin" /> : <PieChart size={13} />} Run backtest
                                </button>
                            )}
                        </div>
                        {!backtest ? (
                            <p className="text-sm text-gray-500">
                                Weight-weighted historical total return of this exact mix (dividend-adjusted, weights held constant). {bting && 'Pulling 5 years of history…'}
                            </p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    {backtest.map((r) => (
                                        <div key={r.label} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{r.label}</p>
                                            <p className={cn('mt-1 text-lg font-bold tabular-nums', r.pct == null ? 'text-gray-600' : r.pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                                {r.pct == null ? 'n/a' : `${r.pct > 0 ? '+' : ''}${r.pct.toFixed(1)}%`}
                                            </p>
                                            {r.cagr != null && <p className="text-[10px] text-gray-500">{r.cagr > 0 ? '+' : ''}{r.cagr.toFixed(1)}%/yr</p>}
                                            {r.pct != null && r.coverage < 99 && <p className="mt-0.5 text-[10px] text-gray-600">{r.coverage}% covered</p>}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                                    Total return incl. dividends, assuming the target weights are rebalanced back to plan; cash earns 0%. Multi-year cells show the annualized (CAGR) rate. Lower “covered” means some holdings lacked that much history (e.g. recent IPOs). Past performance is not indicative of future results.
                                </p>
                            </>
                        )}
                    </section>

                    {/* Market-entry plan */}
                    {(() => {
                        const ep = entryPlan(used, plan);
                        return (
                            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Market-entry plan</h3>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Stat label="Approach" value={ep.approach} />
                                    <Stat label="Cadence" value={ep.cadence} />
                                    <Stat label="Tranches" value={ep.tranches <= 1 ? '1' : `${ep.tranches}`} />
                                    <Stat label="Per buy" value={fmtMoney(ep.perTranche, used.currency)} />
                                </div>
                                <p className="mt-3 text-sm text-gray-300">
                                    {ep.tranches <= 1
                                        ? `Deploy the full ${fmtMoney(used.capital, used.currency)} in one go.`
                                        : `Deploy ${fmtMoney(used.capital, used.currency)} as ${ep.tranches} ${ep.cadence.toLowerCase()} buys of ~${fmtMoney(ep.perTranche, used.currency)} over ${ep.durationLabel}.`}{' '}
                                    {ep.rebalance}
                                </p>
                                <ul className="mt-3 space-y-1.5 text-[13px] text-gray-400">
                                    {ep.notes.map((n, i) => (
                                        <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" />{n}</li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })()}

                    {/* Risk / return */}
                    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Risk &amp; return profile</h3>
                        <div className="grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
                            <RiskItem label="Volatility" text={plan.risk.volatility} />
                            <RiskItem label="Drawdown" text={plan.risk.drawdown} />
                            <RiskItem label="Should outperform" text={plan.risk.outperform} />
                            <RiskItem label="Should underperform" text={plan.risk.underperform} />
                            <RiskItem label="Risk clusters" text={plan.risk.clusters} />
                        </div>
                    </section>

                    {/* Code + tweaks */}
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 md:p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Allocation engine (TS)</h3>
                                <button type="button" onClick={copyCode} className="flex items-center gap-1 text-xs text-gray-400 hover:text-teal-300">
                                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="max-h-72 overflow-auto rounded-lg bg-gray-950/60 p-3 text-[11px] leading-relaxed text-gray-300"><code>{CODE}</code></pre>
                        </div>
                        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Tweak the bias</h3>
                            <ul className="space-y-1.5 text-sm text-gray-300">
                                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" /><span><span className="text-gray-200">More aggressive:</span> raise risk to High, single-name max up, fewer positions.</span></li>
                                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" /><span><span className="text-gray-200">More defensive:</span> Conservative/Income bias, lower risk → bigger bond + cash sleeves.</span></li>
                                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" /><span><span className="text-gray-200">More concentrated:</span> set ~12 positions and a higher single-name cap.</span></li>
                                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" /><span><span className="text-gray-200">More diversified:</span> ~30 positions, lower sector cap, ETF-heavy.</span></li>
                            </ul>
                            <p className="mt-3 text-[11px] text-gray-500">Hypothetical &amp; educational — no advice, no performance claims.</p>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function Row({ h, ccy, capital, price, showDeploy }: { h: Holding; ccy: string; capital: number; price?: number | null; showDeploy: boolean }) {
    const value = (h.weight / 100) * capital;
    const shares = price ? Math.floor(value / price) : null;
    const isCash = h.sleeve === 'cash';
    return (
        <tr className="border-b border-gray-800/60 align-top hover:bg-gray-800/30">
            <td className="px-3 py-2.5">
                {isCash ? <span className="font-semibold text-gray-300">CASH</span> : (
                    <Link href={`/stocks/${h.ticker}`} className="font-semibold text-gray-100 hover:text-teal-400">{h.ticker}</Link>
                )}
                <span className={cn('ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold uppercase', h.type === 'etf' ? 'bg-indigo-400/15 text-indigo-300' : h.type === 'cash' ? 'bg-gray-700 text-gray-400' : 'bg-teal-400/15 text-teal-300')}>{h.type}</span>
            </td>
            <td className="px-3 py-2.5">
                <div className="text-gray-200">{h.name}</div>
                <div className="text-[11px] leading-snug text-gray-500">{h.rationale}</div>
            </td>
            <td className="px-3 py-2.5 text-gray-400">{h.sector}</td>
            <td className="px-3 py-2.5 text-gray-400">{h.sleeve === 'cash' ? '—' : h.region}</td>
            <td className="px-3 py-2.5 text-gray-400">{h.role}</td>
            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-100">{h.weight}%</td>
            {showDeploy && <td className="px-3 py-2.5 text-right tabular-nums text-gray-300">{fmtMoney(value, ccy)}</td>}
            {showDeploy && <td className="px-3 py-2.5 text-right tabular-nums text-gray-400">{isCash ? '—' : price ? shares : '—'}</td>}
        </tr>
    );
}

function Breakdown({ title, rows }: { title: string; rows: { name: string; pct: number }[] }) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{title}</h3>
            <div className="space-y-2">
                {rows.map((r) => (
                    <div key={r.name} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-sm text-gray-300">{r.name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full rounded-full bg-teal-400/70" style={{ width: `${Math.min(100, r.pct)}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-gray-400">{r.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-100">{value}</p>
        </div>
    );
}

function RiskItem({ label, text }: { label: string; text: string }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="leading-relaxed text-gray-300">{text}</p>
        </div>
    );
}

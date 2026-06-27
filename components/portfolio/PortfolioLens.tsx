'use client';

/**
 * Portfolio Lens — a ticker-driven, value-cycle portfolio builder.
 *
 * The user assembles a basket (tickers + editable weights); on Analyze the
 * server gathers a portfolio-level read (Health Score, cycle exposure,
 * concentration, risks) plus, per holding, its price, returns, a sparkline and
 * the 5-step Consensus framework. The proprietary analysis lives in the private
 * engine; this is the presentation + interaction layer. Educational only.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Gauge, Plus, X, Loader2, Sparkles, AlertTriangle, Shuffle, Download,
    GraduationCap, ChevronDown, Layers, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, isTickerLike } from '@/lib/utils';
import {
    analyzePortfolio,
    type PortfolioAnalysis,
    type PortfolioHoldingAnalysis,
} from '@/lib/actions/portfolio.actions';

interface Holding {
    symbol: string;
    weight: number;
}

const STARTER: Holding[] = [
    { symbol: 'MSFT', weight: 30 },
    { symbol: 'NVDA', weight: 25 },
    { symbol: 'GOOGL', weight: 25 },
    { symbol: 'AMZN', weight: 20 },
];

const QUICK_ADD = ['MSFT', 'NVDA', 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO', 'LLY', 'COST'];

// A stable, readable palette for allocation segments / holding accents.
const PALETTE = ['#2dd4bf', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb923c', '#a78bfa', '#f87171', '#22d3ee'];

const pctStr = (v: number | null | undefined) =>
    v == null || !Number.isFinite(v) ? 'n/a' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

const GLOSSARY: { term: string; def: string }[] = [
    { term: 'FCF (Free Cash Flow)', def: 'Cash a business generates after capital spending — what is actually available to fund dividends, buybacks or debt paydown.' },
    { term: 'Capex', def: 'Capital expenditure: money spent building long-lived assets (e.g. AI data centers). Heavy capex can compress near-term FCF and margins.' },
    { term: 'ROIC', def: 'Return on Invested Capital — how much profit a company earns on the capital it deploys. Spending only creates value when ROIC beats the cost of capital.' },
    { term: 'Value Cycle', def: 'Where a stock or sector sits across accumulation, expansion, margin-pressure and reset phases — the backdrop that frames valuation and risk/reward.' },
    { term: '52-week range', def: 'The highest and lowest price over the past year. Proximity to the low (with intact fundamentals) is where value-oriented analysts look for entries.' },
];

const FRAMEWORK: { n: number; title: string; body: string }[] = [
    { n: 1, title: 'Current Position', body: 'Price action, proximity to the 52-week low/high, recent drawdown, and the apparent catalyst for any weakness.' },
    { n: 2, title: 'Long-Term Growth Thesis', body: 'The durable bull case — moat, real revenue drivers (AI/cloud), market opportunity and optionality.' },
    { n: 3, title: 'The One Thing Holding Back', body: 'The single biggest concern — typically capex intensity, FCF/margin pressure and the ROIC needed to justify the spend.' },
    { n: 4, title: 'Cycle & Valuation', body: 'Where it sits in the market/value cycle, multiples versus history and growth, short-term pressure vs long-term return.' },
    { n: 5, title: 'Overall Judgment', body: 'A balanced synthesis: is this an attractive entry, what would raise conviction, and the risk/reward — educational, never a buy/sell call.' },
];

export default function PortfolioLens() {
    const [holdings, setHoldings] = useState<Holding[]>(STARTER);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PortfolioAnalysis | null>(null);
    const [showFramework, setShowFramework] = useState(false);

    const total = useMemo(() => holdings.reduce((s, h) => s + (Number(h.weight) || 0), 0), [holdings]);

    const addSymbol = (raw: string) => {
        const sym = raw.toUpperCase().trim().replace(/[^A-Z0-9.\-:]/g, '');
        if (!sym) return;
        if (!isTickerLike(sym)) { toast.error(`“${sym}” doesn’t look like a ticker`); return; }
        if (holdings.some((h) => h.symbol === sym)) { toast.error(`${sym} is already in the basket`); return; }
        if (holdings.length >= 25) { toast.error('Max 25 holdings'); return; }
        // New names default to an even-ish slice of the remaining room.
        const remaining = Math.max(0, 100 - total);
        setHoldings((h) => [...h, { symbol: sym, weight: Math.round(remaining > 0 ? Math.min(remaining, 20) : 10) }]);
        setDraft('');
    };

    const setWeight = (sym: string, w: number) =>
        setHoldings((h) => h.map((x) => (x.symbol === sym ? { ...x, weight: Math.max(0, Math.min(100, w)) } : x)));

    const remove = (sym: string) => setHoldings((h) => h.filter((x) => x.symbol !== sym));

    const normalize = () => {
        if (total <= 0) return;
        setHoldings((h) => {
            const scaled = h.map((x) => ({ ...x, weight: (x.weight / total) * 100 }));
            // Round to whole percents, then fix the rounding drift on the largest holding.
            const rounded = scaled.map((x) => ({ ...x, weight: Math.round(x.weight) }));
            const drift = 100 - rounded.reduce((s, x) => s + x.weight, 0);
            if (drift !== 0 && rounded.length) {
                const idx = rounded.reduce((mi, x, i, a) => (x.weight > a[mi].weight ? i : mi), 0);
                rounded[idx] = { ...rounded[idx], weight: rounded[idx].weight + drift };
            }
            return rounded;
        });
    };

    const analyze = async () => {
        if (holdings.length === 0) { toast.error('Add at least one ticker'); return; }
        setLoading(true);
        try {
            const res = await analyzePortfolio(holdings);
            setResult(res);
            if (!res.lens && res.holdings.every((h) => !h.consensus)) {
                toast.error('Analysis is unavailable right now — please try again shortly.');
            }
        } catch {
            toast.error('Something went wrong analyzing the portfolio.');
        } finally {
            setLoading(false);
        }
    };

    const exportJSON = () => {
        const payload = { generatedAt: new Date().toISOString(), holdings, analysis: result };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-lens-${holdings.map((h) => h.symbol).join('-').slice(0, 60) || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const weightOf = (sym: string) => holdings.find((h) => h.symbol === sym)?.weight ?? 0;

    return (
        <div className="space-y-6">
            {/* ---- Basket builder ---- */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Layers size={16} className="text-teal-400" /> Build your basket
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-700">
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymbol(draft); } }}
                            placeholder="Add ticker (e.g. MSFT)"
                            className="w-44 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                            maxLength={12}
                            aria-label="Add a ticker"
                        />
                        <button type="button" onClick={() => addSymbol(draft)}
                            className="flex items-center gap-1 bg-teal-500/15 px-3 text-sm font-semibold text-teal-300 hover:bg-teal-500/25">
                            <Plus size={15} /> Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_ADD.filter((s) => !holdings.some((h) => h.symbol === s)).slice(0, 6).map((s) => (
                            <button key={s} type="button" onClick={() => addSymbol(s)}
                                className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:border-teal-400/40 hover:text-teal-300">
                                + {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Holdings editor */}
                <div className="mt-4 space-y-2">
                    {holdings.map((h, i) => (
                        <div key={h.symbol} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                            <Link href={`/stocks/${h.symbol}`} className="w-20 shrink-0 font-semibold text-gray-100 hover:text-teal-400">{h.symbol}</Link>
                            <input
                                type="range" min={0} max={100} value={h.weight}
                                onChange={(e) => setWeight(h.symbol, Number(e.target.value))}
                                className="h-1.5 flex-1 accent-teal-400"
                                aria-label={`${h.symbol} weight`}
                            />
                            <div className="relative w-20 shrink-0">
                                <input
                                    type="number" min={0} max={100} value={Math.round(h.weight)}
                                    onChange={(e) => setWeight(h.symbol, Number(e.target.value))}
                                    className="w-full rounded-md border border-gray-700 bg-gray-800 py-1 pl-2 pr-5 text-right text-sm tabular-nums text-gray-100 focus:border-teal-400/60 focus:outline-none"
                                />
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                            </div>
                            <button type="button" onClick={() => remove(h.symbol)} className="text-gray-600 hover:text-red-400" aria-label={`Remove ${h.symbol}`}>
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    {holdings.length === 0 && (
                        <p className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-sm text-gray-500">
                            Add a few tickers to begin — try {QUICK_ADD.slice(0, 4).join(', ')}.
                        </p>
                    )}
                </div>

                {/* Allocation bar + total */}
                {holdings.length > 0 && (
                    <>
                        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-800">
                            {holdings.map((h, i) => (
                                <div key={h.symbol} title={`${h.symbol} ${Math.round(h.weight)}%`}
                                    style={{ width: `${total > 0 ? (h.weight / total) * 100 : 0}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Total allocation</span>
                                <span className={cn('font-semibold tabular-nums', Math.round(total) === 100 ? 'text-emerald-400' : 'text-amber-400')}>
                                    {Math.round(total)}%
                                </span>
                                {Math.round(total) !== 100 && (
                                    <button type="button" onClick={normalize}
                                        className="flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:border-teal-400/40 hover:text-teal-300">
                                        <Shuffle size={12} /> Normalize to 100%
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={analyze} disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400 disabled:opacity-60">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Gauge size={16} />}
                                {loading ? 'Analyzing…' : 'Analyze portfolio'}
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* ---- Results ---- */}
            {result && (
                <>
                    {result.lens && (
                        <PortfolioLensPanel lens={result.lens} onExport={exportJSON} />
                    )}

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                                <Target size={16} className="text-teal-400" /> Holding analysis
                            </h2>
                            {!result.lens && (
                                <button type="button" onClick={exportJSON}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:text-teal-300">
                                    <Download size={13} /> Export JSON
                                </button>
                            )}
                        </div>
                        {result.holdings.map((h) => (
                            <HoldingCard key={h.symbol} h={h} weight={weightOf(h.symbol)} />
                        ))}
                    </section>
                </>
            )}

            {/* ---- Learn the framework ---- */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <button type="button" onClick={() => setShowFramework((v) => !v)}
                    className="flex w-full items-center gap-2 text-base font-semibold text-gray-100">
                    <GraduationCap size={16} className="text-teal-400" /> Learn the framework
                    <ChevronDown size={16} className={cn('ml-auto text-gray-500 transition-transform', showFramework && 'rotate-180')} />
                </button>
                {showFramework && (
                    <div className="mt-4 space-y-5">
                        <ol className="space-y-3">
                            {FRAMEWORK.map((f) => (
                                <li key={f.n} className="flex gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-300">{f.n}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-100">{f.title}</p>
                                        <p className="text-sm leading-relaxed text-gray-400">{f.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Glossary</h3>
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {GLOSSARY.map((g) => (
                                    <div key={g.term} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                        <dt className="text-sm font-semibold text-teal-300/90">{g.term}</dt>
                                        <dd className="mt-1 text-[13px] leading-relaxed text-gray-400">{g.def}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                )}
            </section>

            <p className="text-[11px] leading-relaxed text-gray-600">
                Hypothetical &amp; educational only — not investment advice and no performance claims. A large
                portion of this analysis is AI-generated and may be inaccurate; verify independently.
            </p>
        </div>
    );
}

function scoreColor(score: number): string {
    return score >= 67 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
}

function PortfolioLensPanel({ lens, onExport }: { lens: NonNullable<PortfolioAnalysis['lens']>; onExport: () => void }) {
    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Gauge size={16} className="text-teal-400" /> Portfolio Lens
                    <span className="text-xs font-normal text-gray-500">value-cycle read</span>
                </h2>
                <button type="button" onClick={onExport}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:text-teal-300">
                    <Download size={13} /> Export JSON
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr] md:items-center">
                <HealthGauge score={lens.healthScore} />
                <div className="space-y-3">
                    {lens.scoreRationale && <p className="text-sm leading-relaxed text-gray-300">{lens.scoreRationale}</p>}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {lens.cycleExposure && (
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">Cycle exposure</p>
                                <p className="text-[13px] leading-relaxed text-gray-300">{lens.cycleExposure}</p>
                            </div>
                        )}
                        {lens.concentration && (
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">Concentration</p>
                                <p className="text-[13px] leading-relaxed text-gray-300">{lens.concentration}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {lens.keyRisks.length > 0 && (
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
                            <AlertTriangle size={13} /> Key risks
                        </p>
                        <ul className="space-y-1.5">
                            {lens.keyRisks.map((r, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/70" />{r}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {lens.diversification.length > 0 && (
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-300">
                            <Sparkles size={13} /> Diversification ideas
                        </p>
                        <ul className="space-y-1.5">
                            {lens.diversification.map((d, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/70" />{d}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

function HealthGauge({ score }: { score: number }) {
    const r = 42;
    const c = 2 * Math.PI * r;
    const dash = (score / 100) * c;
    const color = scoreColor(score);
    return (
        <div className="mx-auto flex flex-col items-center">
            <svg width={120} height={120} viewBox="0 0 120 120" className="-rotate-90">
                <circle cx={60} cy={60} r={r} fill="none" stroke="#1f2937" strokeWidth={10} />
                <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={`${dash} ${c - dash}`} />
            </svg>
            <div className="-mt-[78px] mb-[34px] flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color }}>{score}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Health</span>
            </div>
        </div>
    );
}

function Sparkline({ values }: { values: number[] }) {
    if (values.length < 2) return null;
    const w = 120, h = 32, pad = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = pad + (1 - (v - min) / span) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const up = values[values.length - 1] >= values[0];
    const color = up ? '#34d399' : '#f87171';
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function HoldingCard({ h, weight }: { h: PortfolioHoldingAnalysis; weight: number }) {
    const [open, setOpen] = useState(false);
    const sections = h.consensus?.sections ?? [];
    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href={`/stocks/${h.symbol}`} className="text-lg font-bold text-gray-100 hover:text-teal-400">{h.symbol}</Link>
                <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-300 tabular-nums">{Math.round(weight)}%</span>
                {h.price != null && <span className="text-sm tabular-nums text-gray-300">${h.price.toFixed(2)}</span>}
                <div className="flex items-center gap-2 text-xs">
                    {(['ytd', 'm1', 'm3', 'y1'] as const).map((k) => {
                        const v = h.ret[k];
                        const label = k === 'ytd' ? 'YTD' : k === 'm1' ? '1M' : k === 'm3' ? '3M' : '1Y';
                        return (
                            <span key={k} className="flex items-center gap-1">
                                <span className="text-gray-600">{label}</span>
                                <span className={cn('tabular-nums', v == null ? 'text-gray-600' : v >= 0 ? 'text-emerald-400' : 'text-red-400')}>{pctStr(v)}</span>
                            </span>
                        );
                    })}
                </div>
                <div className="ml-auto"><Sparkline values={h.spark} /></div>
            </div>

            {sections.length > 0 ? (
                <div className="mt-3">
                    <button type="button" onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200">
                        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
                        {open ? 'Hide' : 'Show'} 5-step analysis
                    </button>
                    {open && (
                        <div className="mt-3 flex flex-col gap-3 border-t border-gray-800 pt-3">
                            {sections.map((s, i) => (
                                <div key={i}>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-300/80">{i + 1}. {s.title}</p>
                                    <p className="text-sm leading-relaxed text-gray-300">{s.body}</p>
                                </div>
                            ))}
                            <p className="text-[11px] text-gray-600">Educational analysis only — not financial advice.</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="mt-3 text-xs text-gray-500">5-step analysis unavailable for this ticker right now.</p>
            )}
        </div>
    );
}

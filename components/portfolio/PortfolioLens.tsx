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

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Gauge, Plus, X, Loader2, Sparkles, AlertTriangle, Shuffle, Download,
    GraduationCap, ChevronDown, Layers, Target, ShieldCheck, Scale, Rocket, Wand2, ArrowDown,
    Save, FolderOpen, Trash2, ListPlus, Bookmark, Import as ImportIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, isTickerLike } from '@/lib/utils';
import {
    analyzePortfolio,
    suggestEtfPortfolio,
    type PortfolioAnalysis,
    type PortfolioHoldingAnalysis,
    type RiskProfile,
    type Horizon,
    type EtfSuggestion,
} from '@/lib/actions/portfolio.actions';
import { createGroup, addSymbolsToGroup, listGroupsWithSymbols } from '@/lib/actions/watchlist-groups.actions';

interface WatchlistOption {
    id: number;
    name: string;
    symbols: string[];
}

/** Equal-weight a ticker list into integer weights summing to exactly 100. */
function equalWeights(symbols: string[]): Holding[] {
    const n = symbols.length;
    if (n === 0) return [];
    const base = Math.floor(100 / n);
    const rem = 100 - base * n;
    return symbols.map((s, i) => ({ symbol: s, weight: base + (i < rem ? 1 : 0) }));
}

interface Holding {
    symbol: string;
    weight: number;
}

interface SavedBasket {
    id: string;
    name: string;
    holdings: Holding[];
    savedAt: number;
}

const BASKETS_KEY = 'feedcast.portfolioLens.baskets.v1';

function loadBaskets(): SavedBasket[] {
    try {
        const raw = localStorage.getItem(BASKETS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((b): b is SavedBasket => b && typeof b.id === 'string' && Array.isArray(b.holdings))
            .map((b) => ({ ...b, holdings: b.holdings.filter((h: Holding) => h?.symbol) }));
    } catch {
        return [];
    }
}

function persistBaskets(baskets: SavedBasket[]) {
    try {
        localStorage.setItem(BASKETS_KEY, JSON.stringify(baskets));
    } catch {
        /* storage full / unavailable — non-fatal */
    }
}

const RISK_OPTS: { v: RiskProfile; label: string; icon: typeof ShieldCheck }[] = [
    { v: 'conservative', label: 'Conservative', icon: ShieldCheck },
    { v: 'balanced', label: 'Balanced', icon: Scale },
    { v: 'aggressive', label: 'Aggressive', icon: Rocket },
];

const HORIZON_OPTS: { v: Horizon; label: string }[] = [
    { v: 'short', label: '< 3 yrs' },
    { v: 'medium', label: '3–7 yrs' },
    { v: 'long', label: '> 7 yrs' },
];

function Seg<T extends string>({ value, opts, onChange }: { value: T; opts: { v: T; label: string }[]; onChange: (v: T) => void }) {
    return (
        <div className="inline-flex flex-wrap overflow-hidden rounded-lg border border-gray-700">
            {opts.map((o, i) => (
                <button key={o.v} type="button" onClick={() => onChange(o.v)}
                    className={cn('px-3 py-1.5 text-sm font-medium transition-colors', i > 0 && 'border-l border-gray-700',
                        value === o.v ? 'bg-teal-500/15 text-teal-300' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
                    {o.label}
                </button>
            ))}
        </div>
    );
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

    // Ready-made AI ETF starter
    const [risk, setRisk] = useState<RiskProfile>('balanced');
    const [horizon, setHorizon] = useState<Horizon>('long');
    const [suggesting, setSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<EtfSuggestion | null>(null);

    // Saved baskets (localStorage) + watchlist promotion
    const [baskets, setBaskets] = useState<SavedBasket[]>([]);
    const [naming, setNaming] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [creatingWl, setCreatingWl] = useState<string | null>(null);

    // Import from watchlist — loaded once on mount so the option is always visible.
    const [watchlists, setWatchlists] = useState<WatchlistOption[] | null>(null);
    const [loadingWatchlists, setLoadingWatchlists] = useState(true);

    useEffect(() => {
        setBaskets(loadBaskets());
        let alive = true;
        listGroupsWithSymbols()
            .then((g) => { if (alive) setWatchlists(g); })
            .catch(() => { if (alive) setWatchlists([]); })
            .finally(() => { if (alive) setLoadingWatchlists(false); });
        return () => { alive = false; };
    }, []);

    const importFromWatchlist = (w: WatchlistOption) => {
        const syms = [...new Set(w.symbols.map((s) => s.toUpperCase()).filter(isTickerLike))].slice(0, 25);
        if (syms.length === 0) { toast.error(`“${w.name}” has no tickers to import`); return; }
        setHoldings(equalWeights(syms));
        setResult(null);
        toast.success(`Imported ${syms.length} ticker${syms.length === 1 ? '' : 's'} from “${w.name}”`);
    };

    const total = useMemo(() => holdings.reduce((s, h) => s + (Number(h.weight) || 0), 0), [holdings]);

    const suggestName = () => {
        const syms = holdings.map((h) => h.symbol);
        if (syms.length === 0) return 'My basket';
        return syms.length <= 3 ? syms.join(', ') : `${syms.slice(0, 2).join(', ')} +${syms.length - 2}`;
    };

    const saveBasket = () => {
        const name = nameDraft.trim() || suggestName();
        if (holdings.length === 0) { toast.error('Add some tickers first'); return; }
        const basket: SavedBasket = {
            id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
            name,
            holdings: holdings.map((h) => ({ symbol: h.symbol, weight: h.weight })),
            savedAt: Date.now(),
        };
        const next = [basket, ...baskets].slice(0, 30);
        setBaskets(next);
        persistBaskets(next);
        setNaming(false);
        setNameDraft('');
        toast.success(`Saved “${name}”`);
    };

    const deleteBasket = (id: string) => {
        const next = baskets.filter((b) => b.id !== id);
        setBaskets(next);
        persistBaskets(next);
    };

    const loadBasket = (b: SavedBasket) => {
        setHoldings(b.holdings.map((h) => ({ symbol: h.symbol, weight: h.weight })));
        setResult(null);
        toast.success(`Loaded “${b.name}” into the basket`);
    };

    const createWatchlistFrom = async (b: SavedBasket) => {
        const tickers = b.holdings.map((h) => h.symbol).filter(Boolean);
        if (tickers.length === 0) { toast.error('This basket has no tickers'); return; }
        setCreatingWl(b.id);
        try {
            const res = await createGroup(b.name);
            if (!res.ok || !res.id) { toast.error(res.error ?? 'Could not create the watchlist'); return; }
            const add = await addSymbolsToGroup(res.id, tickers.join(','));
            if (!add.ok) { toast.error(add.error ?? 'Watchlist created, but adding tickers failed'); return; }
            toast.success(`Created watchlist “${b.name}” with ${add.added} tickers`);
        } catch {
            toast.error('Could not create the watchlist.');
        } finally {
            setCreatingWl(null);
        }
    };

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

    const runAnalyze = async (list: Holding[]) => {
        if (list.length === 0) { toast.error('Add at least one ticker'); return; }
        setLoading(true);
        try {
            const res = await analyzePortfolio(list);
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

    const analyze = () => runAnalyze(holdings);

    const generateSuggestion = async () => {
        setSuggesting(true);
        try {
            const res = await suggestEtfPortfolio(risk, horizon);
            if (!res || res.holdings.length === 0) {
                toast.error('Couldn’t generate a portfolio right now — please try again shortly.');
                return;
            }
            setSuggestion(res);
        } catch {
            toast.error('Something went wrong generating the portfolio.');
        } finally {
            setSuggesting(false);
        }
    };

    const loadSuggestion = (analyzeNow: boolean) => {
        if (!suggestion) return;
        const list: Holding[] = suggestion.holdings.map((h) => ({ symbol: h.ticker, weight: h.weight }));
        setHoldings(list);
        toast.success(`Loaded ${list.length} ETFs into your basket`);
        if (analyzeNow) void runAnalyze(list);
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
            {/* ---- Ready-made AI ETF portfolio ---- */}
            <section className="rounded-2xl border border-teal-500/20 bg-teal-500/[0.04] p-4 md:p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Wand2 size={16} className="text-teal-400" /> Ready-made ETF portfolio
                    <span className="text-xs font-normal text-gray-500">AI-generated</span>
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    Pick a risk profile and how long you plan to hold — get a cycle-aware, value-disciplined
                    ETF starter portfolio you can load and analyze in one click.
                </p>

                <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Risk profile</label>
                        <Seg value={risk} onChange={setRisk} opts={RISK_OPTS} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Holding period</label>
                        <Seg value={horizon} onChange={setHorizon} opts={HORIZON_OPTS} />
                    </div>
                    <button type="button" onClick={generateSuggestion} disabled={suggesting}
                        className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400 disabled:opacity-60">
                        {suggesting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        {suggesting ? 'Generating…' : suggestion ? 'Regenerate' : 'Generate portfolio'}
                    </button>
                </div>

                {suggestion && (
                    <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950/40 p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-teal-300">{suggestion.risk}</span>
                            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300">
                                {HORIZON_OPTS.find((h) => h.v === suggestion.horizon)?.label} horizon
                            </span>
                            <span className="text-xs text-gray-500">{suggestion.holdings.length} ETFs</span>
                        </div>
                        {suggestion.strategy && <p className="text-sm leading-relaxed text-gray-300">{suggestion.strategy}</p>}
                        {suggestion.cycleNote && (
                            <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
                                <span className="font-semibold text-gray-300">Cycle: </span>{suggestion.cycleNote}
                            </p>
                        )}

                        {/* Allocation bar */}
                        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-gray-800">
                            {suggestion.holdings.map((h, i) => (
                                <div key={h.ticker} title={`${h.ticker} ${h.weight}%`}
                                    style={{ width: `${h.weight}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                            ))}
                        </div>

                        {/* ETF list */}
                        <ul className="mt-3 divide-y divide-gray-800/70">
                            {suggestion.holdings.map((h, i) => (
                                <li key={h.ticker} className="flex items-center gap-3 py-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                                    <span className="w-14 shrink-0 font-semibold text-gray-100">{h.ticker}</span>
                                    <span className="min-w-0 flex-1 truncate text-[13px] text-gray-400">
                                        {h.name}{h.role && <span className="text-gray-600"> · {h.role}</span>}
                                    </span>
                                    <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-200">{h.weight}%</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => loadSuggestion(true)} disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400 disabled:opacity-60">
                                {loading ? <Loader2 size={15} className="animate-spin" /> : <Gauge size={15} />} Load &amp; analyze
                            </button>
                            <button type="button" onClick={() => loadSuggestion(false)}
                                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:border-teal-400/40 hover:text-teal-300">
                                <ArrowDown size={15} /> Load into basket
                            </button>
                        </div>
                        <p className="mt-3 text-[11px] text-gray-600">
                            AI-generated from a curated list of liquid ETFs — educational only, not investment advice.
                        </p>
                    </div>
                )}
            </section>

            {/* ---- Import from a watchlist ---- */}
            {(loadingWatchlists || (watchlists && watchlists.length > 0)) && (
                <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                        <ImportIcon size={16} className="text-teal-400" /> Import from your watchlist
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Turn any of your watchlists into an equal-weighted basket — then analyze, save or re-allocate it.
                    </p>
                    {loadingWatchlists ? (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 size={14} className="animate-spin" /> Loading your watchlists…
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {watchlists!.map((w) => (
                                <div key={w.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-gray-100">{w.name}</p>
                                        <p className="text-xs text-gray-500">{w.symbols.length} ticker{w.symbols.length === 1 ? '' : 's'}</p>
                                    </div>
                                    <button type="button" onClick={() => importFromWatchlist(w)} disabled={w.symbols.length === 0}
                                        className="flex shrink-0 items-center gap-1.5 rounded-md bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-40 disabled:hover:bg-teal-500/15">
                                        <ArrowDown size={13} /> Import
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ---- Basket builder ---- */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Layers size={16} className="text-teal-400" /> Build your basket
                </h2>
                <p className="mb-4 text-sm text-gray-500">Or assemble your own — add tickers and set weights.</p>

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
                            <div className="flex items-center gap-2">
                                {naming ? (
                                    <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-700">
                                        <input
                                            value={nameDraft}
                                            onChange={(e) => setNameDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); saveBasket(); }
                                                if (e.key === 'Escape') { setNaming(false); setNameDraft(''); }
                                            }}
                                            placeholder={suggestName()}
                                            autoFocus
                                            maxLength={40}
                                            className="w-40 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                                            aria-label="Basket name"
                                        />
                                        <button type="button" onClick={saveBasket}
                                            className="bg-teal-500/15 px-3 text-sm font-semibold text-teal-300 hover:bg-teal-500/25">Save</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => { setNameDraft(suggestName()); setNaming(true); }}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:border-teal-400/40 hover:text-teal-300">
                                        <Save size={15} /> Save basket
                                    </button>
                                )}
                                <button type="button" onClick={analyze} disabled={loading}
                                    className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400 disabled:opacity-60">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Gauge size={16} />}
                                    {loading ? 'Analyzing…' : 'Analyze portfolio'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ---- Saved baskets ---- */}
            {baskets.length > 0 && (
                <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                        <Bookmark size={16} className="text-teal-400" /> Saved baskets
                        <span className="text-xs font-normal text-gray-500">{baskets.length}</span>
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {baskets.map((b) => (
                            <div key={b.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-gray-100">{b.name}</p>
                                        <p className="text-xs text-gray-500">{b.holdings.length} ticker{b.holdings.length === 1 ? '' : 's'}</p>
                                    </div>
                                    <button type="button" onClick={() => deleteBasket(b.id)} className="shrink-0 text-gray-600 hover:text-red-400" aria-label={`Delete ${b.name}`}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {b.holdings.slice(0, 8).map((h) => (
                                        <span key={h.symbol} className="rounded bg-gray-800 px-1.5 py-0.5 text-[11px] tabular-nums text-gray-300">
                                            {h.symbol} {Math.round(h.weight)}%
                                        </span>
                                    ))}
                                    {b.holdings.length > 8 && <span className="px-1 text-[11px] text-gray-500">+{b.holdings.length - 8}</span>}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => loadBasket(b)}
                                        className="flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-200 hover:border-teal-400/40 hover:text-teal-300">
                                        <FolderOpen size={13} /> Load
                                    </button>
                                    <button type="button" onClick={() => createWatchlistFrom(b)} disabled={creatingWl === b.id}
                                        className="flex items-center gap-1.5 rounded-md bg-teal-500/15 px-2.5 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-50">
                                        {creatingWl === b.id ? <Loader2 size={13} className="animate-spin" /> : <ListPlus size={13} />} Create watchlist
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-[11px] text-gray-600">
                        Saved in this browser. “Create watchlist” saves the basket to your account so it appears under{' '}
                        <Link href="/watchlist" className="underline hover:text-gray-400">Watchlists</Link>.
                    </p>
                </section>
            )}

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

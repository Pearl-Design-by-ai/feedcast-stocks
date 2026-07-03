'use server';

/**
 * Proxy shims → PRIVATE markets-engine. Portfolio construction (the curated
 * catalog + the allocation engine), the entry plan, the historical backtest and
 * last-price lookups all run in the closed engine. See lib/engine-client.ts.
 */

import { enginePost } from '@/lib/engine-client';
import type { PortfolioInputs, PortfolioPlan, EntryPlan } from '@/lib/portfolio/engine';
import { getConsensus, type Consensus } from '@/lib/actions/deepseek.actions';
import { getReturns, fetchDailyClosesMap } from '@/lib/actions/returns.actions';
import { sanitizeSymbols, isTickerLike } from '@/lib/utils';
import { getCurrentUser } from '@/lib/supabase/server';

export interface BacktestRow {
    label: string;
    /** Cumulative total return %, weight-weighted across covered holdings. */
    pct: number | null;
    /** Annualized (CAGR) % for multi-year windows. */
    cagr: number | null;
    /** Share of portfolio weight that had enough history for this window (%). */
    coverage: number;
}

/** Build a portfolio plan + its entry plan in one round-trip. null if engine down. */
export async function buildPortfolioPlan(
    inputs: PortfolioInputs
): Promise<{ plan: PortfolioPlan; entry: EntryPlan } | null> {
    // Portfolio Labs is a member feature (its page redirects anonymous users);
    // enforce it in the action too so the endpoint can't be driven directly.
    if (!(await getCurrentUser())) return null;
    return enginePost<{ plan: PortfolioPlan; entry: EntryPlan } | null>('/v1/portfolio/build', inputs, null);
}

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type Horizon = 'short' | 'medium' | 'long';

export interface EtfHolding {
    ticker: string;
    name: string;
    weight: number;
    role: string;
}

export interface EtfSuggestion {
    risk: RiskProfile;
    horizon: Horizon;
    strategy: string;
    cycleNote: string;
    holdings: EtfHolding[];
}

/**
 * AI-driven, ready-to-use ETF portfolio for a risk profile + holding period.
 * DeepSeek constructs a cycle-aware, value-disciplined allocation from a curated
 * real-ETF universe in the private engine; this is a thin proxy. The Portfolio
 * Lens offers it as a one-click starting basket the user can then analyze.
 */
export async function suggestEtfPortfolio(
    risk: RiskProfile,
    horizon: Horizon
): Promise<EtfSuggestion | null> {
    if (!(await getCurrentUser())) return null;
    // `v` busts the KV cache when the engine's allocation logic changes (v2: risk
    // profile now drives the equity/cash split, not the holding period). The
    // engine ignores the extra field.
    return enginePost<EtfSuggestion | null>('/v1/portfolio/suggest', { risk, horizon, v: 2 }, null);
}

export interface SmartAllocation {
    weights: Record<string, number>;
    basis: string;
    riskOn: boolean;
    items: Array<{ symbol: string; momentum: number; weight: number }>;
}

/**
 * Momentum-tilted weights for the current basket, scaled by market conditions
 * (S&P 500 vs its 200-DMA). Higher-momentum names get more weight; risk-off
 * flattens the tilt. The scoring runs in the private engine; this is a shim.
 */
export async function smartAllocate(symbols: string[]): Promise<SmartAllocation | null> {
    if (!(await getCurrentUser())) return null;
    const clean = sanitizeSymbols(symbols);
    if (clean.length === 0) return null;
    return enginePost<SmartAllocation | null>('/v1/portfolio/allocate', { symbols: clean }, null);
}

/** Weighted historical total-return backtest of a built portfolio. */
export async function getPortfolioReturns(
    holdings: Array<{ ticker: string; weight: number; sleeve?: string }>
): Promise<{ rows: BacktestRow[] }> {
    if (!(await getCurrentUser())) return { rows: [] };
    // Validate + cap before forwarding: this array is client-supplied and each
    // ticker fans out into upstream price fetches in the engine.
    const clean = (Array.isArray(holdings) ? holdings : [])
        .map((h) => ({
            ticker: String(h?.ticker ?? '').trim().toUpperCase(),
            weight: Number(h?.weight) || 0,
            sleeve: h?.sleeve,
        }))
        .filter((h) => (h.ticker === 'CASH' || isTickerLike(h.ticker)) && h.weight > 0)
        .slice(0, 50);
    return enginePost<{ rows: BacktestRow[] }>('/v1/portfolio/backtest', { holdings: clean }, { rows: [] });
}

/** Last prices for a basket — turns target weights into approximate share counts. */
export async function priceBasket(tickers: string[]): Promise<Record<string, number | null>> {
    return enginePost<Record<string, number | null>>('/v1/portfolio/prices', { tickers }, {});
}

export interface PortfolioLens {
    healthScore: number;
    scoreRationale: string;
    cycleExposure: string;
    concentration: string;
    keyRisks: string[];
    diversification: string[];
}

/**
 * Portfolio-level value-cycle read for a user-built basket: a Health Score,
 * cycle exposure, concentration/crowding profile, key risks and diversification
 * moves. Grounded per-holding in the engine; null when the engine is down.
 */
export async function getPortfolioLens(
    holdings: Array<{ symbol: string; weight: number }>
): Promise<PortfolioLens | null> {
    if (!(await getCurrentUser())) return null;
    const clean = holdings
        .map((h) => ({ symbol: h.symbol.toUpperCase().trim(), weight: Number(h.weight) || 0 }))
        .filter((h) => h.symbol && h.weight > 0);
    if (clean.length === 0) return null;
    return enginePost<PortfolioLens | null>('/v1/portfolio/lens', { holdings: clean }, null);
}

export interface PortfolioHoldingAnalysis {
    symbol: string;
    weight: number;
    price: number | null;
    ret: { ytd: number | null; m1: number | null; m3: number | null; y1: number | null };
    /** Downsampled recent closes for a sparkline (chronological). */
    spark: number[];
    consensus: Consensus | null;
}

export interface PortfolioAnalysis {
    lens: PortfolioLens | null;
    holdings: PortfolioHoldingAnalysis[];
}

/** Evenly sample a series down to ~`n` points so sparkline payloads stay small. */
function downsample(values: number[], n = 48): number[] {
    if (values.length <= n) return values;
    const step = (values.length - 1) / (n - 1);
    return Array.from({ length: n }, (_, i) => values[Math.round(i * step)]);
}

/**
 * One round-trip that powers the Portfolio Lens screen: the portfolio-level
 * read plus, per holding, its price, returns, a sparkline series and the 5-step
 * Consensus. Everything runs server-side in parallel and returns plain
 * serializable data so the client just renders.
 */
export async function analyzePortfolio(
    holdings: Array<{ symbol: string; weight: number }>
): Promise<PortfolioAnalysis> {
    // Heavy fan-out (up to 25 Consensus LLM calls + lens + prices). Member-only:
    // the Portfolio Labs page redirects anonymous users; enforce it here too.
    if (!(await getCurrentUser())) return { lens: null, holdings: [] };
    const weightBySymbol = new Map<string, number>();
    for (const h of holdings) {
        const s = h.symbol.toUpperCase().trim();
        if (s) weightBySymbol.set(s, (weightBySymbol.get(s) ?? 0) + (Number(h.weight) || 0));
    }
    const symbols = sanitizeSymbols([...weightBySymbol.keys()]).slice(0, 25);
    if (symbols.length === 0) return { lens: null, holdings: [] };

    const basket = symbols.map((s) => ({ symbol: s, weight: weightBySymbol.get(s) ?? 0 }));

    const [lens, returns, prices, closesMap, consensusList] = await Promise.all([
        getPortfolioLens(basket),
        getReturns(symbols),
        priceBasket(symbols),
        fetchDailyClosesMap(symbols),
        Promise.all(symbols.map((s) => getConsensus(s, s))),
    ]);

    const retBySym = new Map(returns.map((r) => [r.symbol.toUpperCase(), r]));
    const consensusBySym = new Map(symbols.map((s, i) => [s, consensusList[i]]));

    const holdingsOut: PortfolioHoldingAnalysis[] = symbols.map((s) => {
        const r = retBySym.get(s);
        const series = closesMap.get(s) ?? [];
        const spark = downsample(series.slice(-120).map((p) => p.close));
        return {
            symbol: s,
            weight: weightBySymbol.get(s) ?? 0,
            price: prices[s] ?? null,
            ret: { ytd: r?.ytd ?? null, m1: r?.m1 ?? null, m3: r?.m3 ?? null, y1: r?.y1 ?? null },
            spark,
            consensus: consensusBySym.get(s) ?? null,
        };
    });

    return { lens, holdings: holdingsOut };
}

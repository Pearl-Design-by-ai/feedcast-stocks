'use server';

/**
 * Proxy shims → PRIVATE markets-engine. Portfolio construction (the curated
 * catalog + the allocation engine), the entry plan, the historical backtest and
 * last-price lookups all run in the closed engine. See lib/engine-client.ts.
 */

import { enginePost } from '@/lib/engine-client';
import type { PortfolioInputs, PortfolioPlan, EntryPlan } from '@/lib/portfolio/engine';

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
    return enginePost<{ plan: PortfolioPlan; entry: EntryPlan } | null>('/v1/portfolio/build', inputs, null);
}

/** Weighted historical total-return backtest of a built portfolio. */
export async function getPortfolioReturns(
    holdings: Array<{ ticker: string; weight: number; sleeve?: string }>
): Promise<{ rows: BacktestRow[] }> {
    return enginePost<{ rows: BacktestRow[] }>('/v1/portfolio/backtest', { holdings }, { rows: [] });
}

/** Last prices for a basket — turns target weights into approximate share counts. */
export async function priceBasket(tickers: string[]): Promise<Record<string, number | null>> {
    return enginePost<Record<string, number | null>>('/v1/portfolio/prices', { tickers }, {});
}

/**
 * Portfolio Lab — public type contract.
 *
 * The construction engine, curated asset catalog, entry-plan logic and the
 * historical backtest now live in the PRIVATE markets-engine (reached over
 * HTTP). This file only declares the shapes the engine returns; the client
 * calls lib/actions/portfolio.actions.ts to build a plan.
 */

export type Archetype = 'growth' | 'income' | 'conservative' | 'thematic';
export type Theme = 'ai' | 'fintech' | 'em' | 'energy' | 'healthcare';
export type Region = 'US' | 'DM' | 'EM' | 'Global';
export type Style = 'growth' | 'value' | 'blend' | 'dividend' | 'bond' | 'cash';
export type AssetType = 'stock' | 'etf' | 'cash';
export type Universe = 'us' | 'dm' | 'global' | 'em';
export type Concentration = 'concentrated' | 'balanced' | 'diversified';
export type Vehicle = 'etf' | 'stock' | 'mixed';

export interface PortfolioInputs {
    currency: string;
    capital: number;
    horizon: 'short' | 'medium' | 'long';
    risk: 'low' | 'medium' | 'high';
    bias: Archetype;
    theme: Theme;
    universe: Universe;
    sectorCap: number; // %
    singleNameMax: number; // %
    vehicle: Vehicle;
    concentration: Concentration;
}

export interface Holding {
    ticker: string;
    name: string;
    type: AssetType;
    sector: string;
    region: Region;
    role: string;
    rationale: string;
    weight: number; // % 0–100
    sleeve: 'equity' | 'bond' | 'cash';
}

export interface PortfolioPlan {
    archetype: Archetype;
    mandate: string[];
    design: string[];
    holdings: Holding[];
    equityPct: number;
    bondPct: number;
    cashPct: number;
    bySector: { name: string; pct: number }[];
    byRegion: { name: string; pct: number }[];
    risk: {
        volatility: string;
        drawdown: string;
        outperform: string;
        underperform: string;
        clusters: string;
    };
    positions: number;
    singleNameMax: number;
    sectorCap: number;
}

export interface EntryPlan {
    approach: string;
    cadence: 'Weekly' | 'Monthly' | 'Lump sum';
    tranches: number;
    perTranche: number;
    durationLabel: string;
    rebalance: string;
    notes: string[];
}

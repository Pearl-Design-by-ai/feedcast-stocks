'use server';

/**
 * Proxy shims → PRIVATE markets-engine for "famous fund manager" portfolios.
 *
 * The engine tracks a curated set of well-known investors' latest public SEC
 * Form 13F-HR holdings (refreshed by its own cron) and exposes them as plain
 * JSON. This is a thin proxy so Portfolio Labs can let users browse a manager's
 * portfolio and load it as a basket to analyze. 13F data is quarterly and lags
 * the period end — every payload carries an explicit `asOf` date. Educational
 * only; not investment advice. See lib/engine-client.ts.
 */

import { engineGet } from '@/lib/engine-client';

export interface FundManagerHolding {
    cusip: string;
    /** Issuer name as reported on the 13F. */
    name: string;
    /** Resolved US ticker, or null when the CUSIP couldn't be mapped. */
    ticker: string | null;
    /** Share of the manager's 13F portfolio value, in percent. */
    weight: number;
    value: number;
    shares: number;
}

export interface FundManagerSummary {
    slug: string;
    /** Firm name. */
    name: string;
    /** Person behind it. */
    manager: string;
    cik: string;
    /** Report period end (YYYY-MM-DD) — the "as of" date. */
    asOf: string;
    /** Filing date (YYYY-MM-DD). */
    filedAt: string;
    positions: number;
    topSymbols: string[];
}

export interface FundManagerPortfolio extends FundManagerSummary {
    accession: string;
    totalValue: number;
    holdings: FundManagerHolding[];
    updatedAt: string;
}

/** The curated managers we track, with a top-symbols preview for cards. */
export async function listFundManagers(): Promise<FundManagerSummary[]> {
    return engineGet<FundManagerSummary[]>('/v1/managers', {}, []);
}

/** Full latest-13F holdings for one manager, or null if not yet ingested. */
export async function getFundManagerPortfolio(slug: string): Promise<FundManagerPortfolio | null> {
    const clean = slug.trim();
    if (!clean) return null;
    return engineGet<FundManagerPortfolio | null>('/v1/manager', { slug: clean }, null);
}

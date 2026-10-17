/**
 * Data contract for the owner-only /my-portfolio dashboard. Rows in
 * `private_portfolio_documents` carry these shapes in their `payload` column:
 * kind='snapshot' slug='current' → Snapshot, kind='plan' → Plan. They are
 * written by an off-repo sync script, so everything is parsed defensively
 * (see parse.ts) before it reaches the page. Money is USD unless `ccy` says
 * otherwise.
 */

export interface Holding {
    name: string;
    isin?: string | null;
    ticker?: string | null;
    ccy: string;
    nominal?: number | null;
    units?: number | null;
    price?: number | null;
    valueLocal?: number | null;
    valueUsd: number;
    couponPct?: number | null;
    maturity?: string | null;
    ytmPct?: number | null;
    durationYrs?: number | null;
    annualIncomeUsd?: number | null;
    group: string;
    custodian: string;
    account?: string | null;
    role?: string | null;
    source?: string | null;
}

export interface Account {
    id: string;
    name: string;
    custodian: string;
    totalUsd: number;
    holdings: Holding[];
}

export interface Snapshot {
    asOf: string;
    sources: { excelModified?: string | null; ibkrAsOf?: string | null; pricesNote?: string };
    fx: Record<string, number>;
    totals: { marketUsd: number; maturityUsd: number; annualIncomeUsd: number; accruedUsd?: number };
    accounts: Account[];
    allocation: { group: string; valueUsd: number; share: number }[];
    /** 12 values, Jan..Dec. */
    monthlyIncome: number[];
    notes?: string[];
}

export type DiffAction = 'buy' | 'sell' | 'keep' | 'transfer';

export interface DiffRow {
    action: DiffAction;
    name: string;
    isin?: string | null;
    ticker?: string | null;
    custodian: string;
    amountUsd: number;
    nominal?: number | null;
    note?: string | null;
}

export interface Projection {
    policy: string;
    points: { year: number; incomePortfolioUsd: number; cspxUsd?: number | null }[];
    depletionYear?: number | null;
}

export interface DrawdownEpisode {
    peak: string;
    trough: string;
    recovery: string | null;
    ddPct: number;
    fallMonths: number;
    recoveryMonths: number | null;
    totalMonths: number | null;
}

export interface Scenario {
    name: string;
    /** Loss per leverage variant, e.g. { unlevered, margin1m, margin2m }. */
    lossUsd: Record<string, number>;
    recovery: string;
}

export type PlanSummary = {
    netIncomeUsd?: number;
    grossIncomeUsd?: number;
    feesUsd?: number;
    expectedReturnPct?: number;
    durationYrs?: number;
    targetIncomeUsd?: [number, number];
    [k: string]: number | [number, number] | undefined;
};

export interface PlanDrawdown {
    series: Record<string, { month: string; value: number }[]>;
    maxDdPct: Record<string, number>;
    episodes: Record<string, DrawdownEpisode[]>;
}

export interface Plan {
    slug: string;
    title: string;
    subtitle?: string;
    asOf: string;
    account: 'personal' | 'company' | 'both';
    summary: PlanSummary;
    targetHoldings: Holding[];
    diff: DiffRow[];
    monthlyIncome?: number[];
    projections?: Projection[];
    drawdown?: PlanDrawdown;
    scenarios?: Scenario[];
    risks?: string[];
    steps?: string[];
    assumptions?: string[];
    documents?: { title: string; path: string }[];
}

/** A raw row as selected from private_portfolio_documents. */
export interface PortfolioDocumentRow {
    kind: string;
    slug: string;
    as_of: string;
    payload: unknown;
    updated_at?: string | null;
}

export interface PrivatePortfolioData {
    snapshot: Snapshot | null;
    plans: Plan[];
}

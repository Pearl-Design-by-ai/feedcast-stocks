/**
 * Pure math for the /my-portfolio dashboard — allocation shares, the
 * Sell → Buy → Keep diff grouping and the current-vs-plan comparisons. No I/O,
 * so it is unit-tested directly.
 */

import type { Account, DiffAction, DiffRow, Holding, Plan, Snapshot } from './types';

export interface Slice {
    key: string;
    valueUsd: number;
    /** 0..1 of the total; 0 when the total is 0. */
    share: number;
}

export const sum = (xs: number[]) => xs.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);

/** Bucket values by key, largest first, with each bucket's share of the total. */
export function allocate<T>(items: T[], key: (t: T) => string, value: (t: T) => number): Slice[] {
    const map = new Map<string, number>();
    for (const it of items) {
        const k = key(it);
        map.set(k, (map.get(k) ?? 0) + (value(it) || 0));
    }
    const total = sum([...map.values()]);
    return [...map.entries()]
        .map(([k, v]) => ({ key: k, valueUsd: v, share: total > 0 ? v / total : 0 }))
        .sort((a, b) => b.valueUsd - a.valueUsd);
}

export type CustodianBucket = 'UBS' | 'IBKR' | 'Diğer';
export const CUSTODIAN_BUCKETS: CustodianBucket[] = ['UBS', 'IBKR', 'Diğer'];

export function custodianBucket(custodian: string | null | undefined): CustodianBucket {
    const c = (custodian ?? '').toLowerCase();
    if (c.includes('ubs')) return 'UBS';
    if (c.includes('ibkr') || c.includes('interactive')) return 'IBKR';
    return 'Diğer';
}

export const allHoldings = (accounts: Account[]): Holding[] => accounts.flatMap((a) => a.holdings);

export const allocationByGroup = (hs: Holding[]) => allocate(hs, (h) => h.group, (h) => h.valueUsd);

/** Always returns the three buckets (UBS / IBKR / Diğer), in that order. */
export function allocationByCustodian(hs: Holding[]): Slice[] {
    const slices = allocate(hs, (h) => custodianBucket(h.custodian), (h) => h.valueUsd);
    return CUSTODIAN_BUCKETS.map((k) => slices.find((s) => s.key === k) ?? { key: k, valueUsd: 0, share: 0 });
}

/**
 * The snapshot's allocation — the synced one when present, otherwise derived
 * from the holdings. Shares are recomputed so they always sum to 1.
 */
export function snapshotAllocation(s: Snapshot): Slice[] {
    if (s.allocation.length) return allocate(s.allocation, (a) => a.group, (a) => a.valueUsd);
    return allocationByGroup(allHoldings(s.accounts));
}

const CASH_RE = /cash|nakit|money market|likidite/i;
export const isCash = (h: Holding) => CASH_RE.test(h.group) || CASH_RE.test(h.role ?? '');
export const cashUsd = (hs: Holding[]) => sum(hs.filter(isCash).map((h) => h.valueUsd));

/** Display order of the diff: what leaves first, then what comes in. */
export const DIFF_ORDER: DiffAction[] = ['sell', 'buy', 'keep', 'transfer'];

export interface DiffGroup {
    action: DiffAction;
    rows: DiffRow[];
    totalUsd: number;
}

/** Group the diff Sell → Buy → Keep → Transfer (largest first); empty groups dropped. */
export function groupDiff(diff: DiffRow[]): DiffGroup[] {
    return DIFF_ORDER.map((action) => {
        const rows = diff.filter((d) => d.action === action).sort((a, b) => b.amountUsd - a.amountUsd);
        return { action, rows, totalUsd: sum(rows.map((r) => r.amountUsd)) };
    }).filter((g) => g.rows.length > 0);
}

export interface DiffTotals {
    sell: number;
    buy: number;
    keep: number;
    transfer: number;
    /** Cash the plan needs (+) or frees up (−): buys minus sells. */
    netCashUsd: number;
}

export function diffTotals(diff: DiffRow[]): DiffTotals {
    const t = (a: DiffAction) => sum(diff.filter((d) => d.action === a).map((d) => d.amountUsd));
    const sell = t('sell');
    const buy = t('buy');
    return { sell, buy, keep: t('keep'), transfer: t('transfer'), netCashUsd: buy - sell };
}

const COMPANY_RE = /company|corp|şirket|sirket|ltd|inc\b|gmbh|a\.ş/i;

/**
 * The snapshot accounts a plan applies to. Plans scoped to 'company' or
 * 'personal' compare against the matching accounts; if nothing matches (the
 * names don't say), fall back to every account rather than an empty column.
 */
export function accountsForScope(accounts: Account[], scope: Plan['account']): Account[] {
    if (scope === 'both') return accounts;
    const isCompany = (a: Account) => COMPANY_RE.test(`${a.id} ${a.name}`);
    const picked = accounts.filter((a) => (scope === 'company' ? isCompany(a) : !isCompany(a)));
    return picked.length ? picked : accounts;
}

/** Case- and dotted/dotless-i-insensitive fold for account matching. */
const fold = (s: string) => s.normalize('NFD').replace(/\u0307/g, '').toLowerCase().replace(/ı/g, 'i');

/** Accounts whose id or name contains any of the needles (case-insensitive). */
export function accountsMatching(accounts: Account[], needles: string[]): Account[] {
    const ns = needles.map((n) => fold(n.trim())).filter(Boolean);
    if (!ns.length) return [];
    return accounts.filter((a) => {
        const hay = [fold(a.id), fold(a.name)];
        return ns.some((n) => hay.some((h) => h.includes(n)));
    });
}

export interface PlanScope {
    accounts: Account[];
    /** True when picked by the plan's `scopeAccounts`, false for the heuristic. */
    explicit: boolean;
    /** True when the scope is every snapshot account. */
    whole: boolean;
}

/**
 * The snapshot accounts a plan's "current" side uses: its explicit
 * `scopeAccounts` when given (no fallback — an empty match stays empty, so a
 * typo can't silently compare against the whole portfolio), otherwise the
 * personal/company heuristic.
 */
export function planScope(accounts: Account[], plan: Pick<Plan, 'account' | 'scopeAccounts'>): PlanScope {
    const explicit = !!plan.scopeAccounts?.length;
    const picked = explicit ? accountsMatching(accounts, plan.scopeAccounts!) : accountsForScope(accounts, plan.account);
    return { accounts: picked, explicit, whole: accounts.length > 0 && picked.length === accounts.length };
}

/**
 * Current annual income of the accounts in scope — the synced total for the
 * whole snapshot, otherwise the scoped holdings' income.
 */
export function scopeIncomeUsd(snapshot: Snapshot, scope: PlanScope): number {
    if (scope.whole && snapshot.totals.annualIncomeUsd) return snapshot.totals.annualIncomeUsd;
    return holdingsIncomeUsd(allHoldings(scope.accounts));
}

/**
 * Fresh cash the plan needs (+) or frees (−). With a snapshot it's the target
 * book minus the scoped current book; without one (or no target holdings) it
 * falls back to the diff's buys − sells.
 */
export function netCashNeedUsd(plan: Plan, current: Holding[] | null): number {
    if (current && plan.targetHoldings.length) {
        return sum(plan.targetHoldings.map((h) => h.valueUsd)) - sum(current.map((h) => h.valueUsd));
    }
    return diffTotals(plan.diff).netCashUsd;
}

/** The plan's annual income: net if stated, else gross, else its holdings' income. */
export function planIncomeUsd(p: Plan): number {
    const s = p.summary;
    if (typeof s.netIncomeUsd === 'number') return s.netIncomeUsd;
    if (typeof s.grossIncomeUsd === 'number') return s.grossIncomeUsd;
    if (p.monthlyIncome) return sum(p.monthlyIncome);
    return sum(p.targetHoldings.map((h) => h.annualIncomeUsd ?? 0));
}

export const holdingsIncomeUsd = (hs: Holding[]) => sum(hs.map((h) => h.annualIncomeUsd ?? 0));

/** Side-by-side rows for two slice lists, keyed by the union of keys. */
export function compareSlices(current: Slice[], target: Slice[]) {
    const keys = [...new Set([...current.map((s) => s.key), ...target.map((s) => s.key)])];
    return keys
        .map((key) => {
            const c = current.find((s) => s.key === key);
            const t = target.find((s) => s.key === key);
            const cur = c?.valueUsd ?? 0;
            const tgt = t?.valueUsd ?? 0;
            return { key, current: cur, currentShare: c?.share ?? 0, target: tgt, targetShare: t?.share ?? 0, delta: tgt - cur };
        })
        .sort((a, b) => Math.max(b.current, b.target) - Math.max(a.current, a.target));
}

export interface XY {
    x: number;
    y: number;
}

/**
 * A projection path ready to plot: sorted by x numerically, negatives clamped
 * to 0, and cut right after the first 0 so a depleted portfolio visibly ends
 * on the axis instead of running along it.
 */
export function trimAtDepletion(points: XY[]): XY[] {
    const out: XY[] = [];
    for (const p of [...points].sort((a, b) => a.x - b.x)) {
        const y = Math.max(0, p.y);
        out.push({ x: p.x, y });
        if (y === 0 && out.length > 1) break;
    }
    return out;
}

/** The stated depletion year, else the first year the portfolio hits 0. */
export function depletionYear(points: { year: number; incomePortfolioUsd: number }[], stated?: number | null): number | null {
    if (typeof stated === 'number' && Number.isFinite(stated)) return stated;
    const hit = [...points].sort((a, b) => a.year - b.year).find((p, i) => i > 0 && p.incomePortfolioUsd <= 0);
    return hit ? hit.year : null;
}

/** Underwater curve: % below the running peak at each point (0 at a new high, e.g. −23.4). */
export function underwater(values: number[]): number[] {
    let peak = -Infinity;
    return values.map((v) => {
        peak = Math.max(peak, v);
        return peak > 0 ? (v / peak - 1) * 100 : 0;
    });
}

/** 'YYYY-MM' → fractional year (2020-01 → 2020, 2020-07 → 2020.5); NaN when unparseable. */
export function monthToYear(month: string): number {
    const m = /^(\d{4})(?:-(\d{1,2}))?/.exec(month);
    if (!m) return NaN;
    return Number(m[1]) + (m[2] ? (Number(m[2]) - 1) / 12 : 0);
}

/** Up to ~`count` whole-number ticks spanning [min, max], always including both ends. */
export function integerTicks(min: number, max: number, count = 5): number[] {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi <= lo) return [lo];
    const step = Math.max(1, Math.ceil((hi - lo) / count));
    const ticks: number[] = [];
    for (let t = lo; t <= hi; t += step) ticks.push(t);
    // Replace a last tick that would crowd the end label.
    if (ticks[ticks.length - 1] !== hi) {
        if (hi - ticks[ticks.length - 1] < step * 0.8 && ticks.length > 1) ticks.pop();
        ticks.push(hi);
    }
    return ticks;
}

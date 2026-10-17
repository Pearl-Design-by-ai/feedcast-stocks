import { describe, expect, it } from 'vitest';
import {
    accountsForScope,
    accountsMatching,
    allocate,
    allocationByCustodian,
    cashUsd,
    compareSlices,
    custodianBucket,
    depletionYear,
    diffTotals,
    groupDiff,
    integerTicks,
    monthToYear,
    netCashNeedUsd,
    planIncomeUsd,
    planScope,
    scopeIncomeUsd,
    snapshotAllocation,
    trimAtDepletion,
    underwater,
} from './math';
import { parseDocuments } from './parse';
import { MOCK_ROWS } from './mock';
import type { Account, DiffRow, Holding, Plan, Snapshot } from './types';

const hold = (o: Partial<Holding>): Holding => ({ name: 'Example', ccy: 'USD', valueUsd: 0, group: 'Nakit', custodian: 'UBS', ...o });
const row = (action: DiffRow['action'], amountUsd: number, name: string = action): DiffRow => ({ action, name, custodian: 'UBS', amountUsd });

describe('allocation', () => {
    it('sums buckets, sorts desc and computes shares', () => {
        const s = allocate([{ k: 'a', v: 100 }, { k: 'b', v: 300 }, { k: 'a', v: 100 }], (x) => x.k, (x) => x.v);
        expect(s).toEqual([
            { key: 'b', valueUsd: 300, share: 0.6 },
            { key: 'a', valueUsd: 200, share: 0.4 },
        ]);
    });
    it('gives zero shares for an empty / zero total', () => {
        expect(allocate([{ k: 'a', v: 0 }], (x) => x.k, (x) => x.v)).toEqual([{ key: 'a', valueUsd: 0, share: 0 }]);
        expect(allocate([], () => '', () => 0)).toEqual([]);
    });
    it('buckets custodians into UBS / IBKR / Diğer', () => {
        expect(custodianBucket('UBS Switzerland')).toBe('UBS');
        expect(custodianBucket('Interactive Brokers')).toBe('IBKR');
        expect(custodianBucket(undefined)).toBe('Diğer');
        const s = allocationByCustodian([hold({ custodian: 'IBKR', valueUsd: 50 }), hold({ custodian: 'IBKR', valueUsd: 50 })]);
        expect(s.map((x) => [x.key, x.share])).toEqual([['UBS', 0], ['IBKR', 1], ['Diğer', 0]]);
    });
    it('snapshot allocation shares sum to 1', () => {
        const { snapshot } = parseDocuments(MOCK_ROWS);
        const total = snapshotAllocation(snapshot!).reduce((s, x) => s + x.share, 0);
        expect(total).toBeCloseTo(1, 10);
    });
    it('counts cash by group or role', () => {
        expect(cashUsd([hold({ valueUsd: 10 }), hold({ group: 'Bond', role: 'likidite', valueUsd: 5 }), hold({ group: 'Bond', valueUsd: 99 })])).toBe(15);
    });
    it('compares slices over the union of keys', () => {
        const c = compareSlices([{ key: 'a', valueUsd: 10, share: 1 }], [{ key: 'b', valueUsd: 20, share: 1 }]);
        expect(c).toEqual([
            { key: 'b', current: 0, currentShare: 0, target: 20, targetShare: 1, delta: 20 },
            { key: 'a', current: 10, currentShare: 1, target: 0, targetShare: 0, delta: -10 },
        ]);
    });
});

describe('diff grouping', () => {
    const diff = [row('keep', 5), row('buy', 10, 'b1'), row('sell', 3, 's1'), row('buy', 30, 'b2'), row('sell', 7, 's2'), row('transfer', 1)];

    it('orders Sell → Buy → Keep → Transfer, largest first, with totals', () => {
        const g = groupDiff(diff);
        expect(g.map((x) => x.action)).toEqual(['sell', 'buy', 'keep', 'transfer']);
        expect(g[0].rows.map((r) => r.name)).toEqual(['s2', 's1']);
        expect(g[1].rows.map((r) => r.name)).toEqual(['b2', 'b1']);
        expect(g.map((x) => x.totalUsd)).toEqual([10, 40, 5, 1]);
    });
    it('drops empty groups', () => {
        expect(groupDiff([row('buy', 1)]).map((g) => g.action)).toEqual(['buy']);
        expect(groupDiff([])).toEqual([]);
    });
    it('computes totals and net cash need', () => {
        expect(diffTotals(diff)).toEqual({ sell: 10, buy: 40, keep: 5, transfer: 1, netCashUsd: 30 });
    });
});

describe('plan helpers', () => {
    const base: Plan = { slug: 'x', title: 'x', asOf: '', account: 'both', summary: {}, targetHoldings: [hold({ annualIncomeUsd: 7 })], diff: [] };
    it('prefers net, then gross, then monthly, then holdings income', () => {
        expect(planIncomeUsd({ ...base, summary: { netIncomeUsd: 1, grossIncomeUsd: 2 } })).toBe(1);
        expect(planIncomeUsd({ ...base, summary: { grossIncomeUsd: 2 } })).toBe(2);
        expect(planIncomeUsd({ ...base, monthlyIncome: Array(12).fill(1) })).toBe(12);
        expect(planIncomeUsd(base)).toBe(7);
    });
    it('scopes accounts to company/personal with a fallback to all', () => {
        const accts = [
            { id: 'p', name: 'Örnek Hesap', custodian: 'UBS', totalUsd: 0, holdings: [] },
            { id: 'c', name: 'Örnek Şirket Hesabı', custodian: 'X', totalUsd: 0, holdings: [] },
        ];
        expect(accountsForScope(accts, 'company').map((a) => a.id)).toEqual(['c']);
        expect(accountsForScope(accts, 'personal').map((a) => a.id)).toEqual(['p']);
        expect(accountsForScope(accts, 'both')).toHaveLength(2);
        expect(accountsForScope([accts[0]], 'company').map((a) => a.id)).toEqual(['p']);
    });
});

describe('plan scoping (scopeAccounts)', () => {
    const acct = (id: string, name: string, hs: Holding[] = []): Account => ({ id, name, custodian: 'UBS', totalUsd: 0, holdings: hs });
    const accts = [
        acct('personal-a', 'Örnek Hesap A', [hold({ group: 'Tahvil', valueUsd: 600, annualIncomeUsd: 30 })]),
        acct('personal-b', 'Örnek Hesap B', [hold({ custodian: 'IBKR', group: 'Hisse', valueUsd: 400, annualIncomeUsd: 4 })]),
        acct('company-c', 'Örnek Şirket Hesabı', [hold({ custodian: 'Example Bank', valueUsd: 250, annualIncomeUsd: 11 })]),
    ];
    const snapshot = { totals: { marketUsd: 1250, maturityUsd: 0, annualIncomeUsd: 999 }, accounts: accts } as Snapshot;

    it('matches name or id, case-insensitively (incl. Turkish İ/ı)', () => {
        expect(accountsMatching(accts, ['hesap a']).map((a) => a.id)).toEqual(['personal-a']);
        expect(accountsMatching(accts, ['PERSONAL-B', 'ŞİRKET']).map((a) => a.id)).toEqual(['personal-b', 'company-c']);
        expect(accountsMatching(accts, ['HESABI']).map((a) => a.id)).toEqual(['company-c']);
        expect(accountsMatching(accts, ['', '  '])).toEqual([]);
    });
    it('uses scopeAccounts over the heuristic, with no fallback on an empty match', () => {
        const s = planScope(accts, { account: 'company', scopeAccounts: ['Hesap B'] });
        expect(s).toMatchObject({ explicit: true, whole: false });
        expect(s.accounts.map((a) => a.id)).toEqual(['personal-b']);
        expect(planScope(accts, { account: 'both', scopeAccounts: ['nope'] }).accounts).toEqual([]);
    });
    it('falls back to the personal/company heuristic when absent', () => {
        const s = planScope(accts, { account: 'company' });
        expect(s).toMatchObject({ explicit: false, whole: false });
        expect(s.accounts.map((a) => a.id)).toEqual(['company-c']);
        expect(planScope(accts, { account: 'both' }).whole).toBe(true);
    });
    it('scoped income is the scoped holdings; whole scope keeps the synced total', () => {
        expect(scopeIncomeUsd(snapshot, planScope(accts, { account: 'both', scopeAccounts: ['personal'] }))).toBe(34);
        expect(scopeIncomeUsd(snapshot, planScope(accts, { account: 'both' }))).toBe(999);
    });
    it('net cash need is target book minus the scoped current book', () => {
        const plan: Plan = {
            slug: 'x', title: 'x', asOf: '', account: 'both', summary: {},
            targetHoldings: [hold({ valueUsd: 1000 })],
            diff: [row('buy', 700), row('sell', 100)],
        };
        const scoped = planScope(accts, { account: 'both', scopeAccounts: ['hesap a'] }).accounts.flatMap((a) => a.holdings);
        expect(netCashNeedUsd(plan, scoped)).toBe(400);
        expect(netCashNeedUsd(plan, accts.flatMap((a) => a.holdings))).toBe(-250);
        expect(netCashNeedUsd(plan, null)).toBe(600); // no snapshot → buys − sells
        expect(netCashNeedUsd({ ...plan, targetHoldings: [] }, scoped)).toBe(600);
    });
});

describe('projection series', () => {
    it('sorts numerically, clamps negatives and ends at the first 0', () => {
        const pts = [{ x: 2041, y: 0 }, { x: 2027, y: 100 }, { x: 2040, y: -5 }, { x: 2039, y: 20 }, { x: 2030, y: 80 }];
        expect(trimAtDepletion(pts)).toEqual([
            { x: 2027, y: 100 },
            { x: 2030, y: 80 },
            { x: 2039, y: 20 },
            { x: 2040, y: 0 },
        ]);
        // Years 9 and 10 must not be string-sorted ("10" < "9").
        expect(trimAtDepletion([{ x: 10, y: 1 }, { x: 9, y: 2 }]).map((p) => p.x)).toEqual([9, 10]);
    });
    it('derives the depletion year unless one is stated', () => {
        const pts = [{ year: 2028, incomePortfolioUsd: 50 }, { year: 2027, incomePortfolioUsd: 100 }, { year: 2030, incomePortfolioUsd: 0 }, { year: 2029, incomePortfolioUsd: 0 }];
        expect(depletionYear(pts)).toBe(2029);
        expect(depletionYear(pts, 2035)).toBe(2035);
        expect(depletionYear([{ year: 2027, incomePortfolioUsd: 1 }])).toBeNull();
    });
    it('calendar-year ticks span the range with whole years', () => {
        const t = integerTicks(2027, 2041);
        expect(t[0]).toBe(2027);
        expect(t[t.length - 1]).toBe(2041);
        expect(t.every((x) => Number.isInteger(x))).toBe(true);
        expect(t.length).toBeLessThanOrEqual(7);
        expect([...t].sort((a, b) => a - b)).toEqual(t);
        expect(integerTicks(2006, 2025.9)).toContain(2025);
    });
    it('mock projections run 2027…2046 and the inflation-linked one depletes', () => {
        const plan = parseDocuments(MOCK_ROWS).plans.find((p) => p.slug === 'income-example')!;
        const p = plan.projections![1];
        expect(p.points.map((x) => x.year)).toEqual(Array.from({ length: 20 }, (_, i) => 2027 + i));
        expect(depletionYear(p.points, p.depletionYear)).toBe(2042);
    });
});

describe('underwater / drawdown', () => {
    it('is % below the running peak', () => {
        const dd = underwater([100, 120, 90, 60, 120, 150, 135]);
        expect(dd.map((x) => Math.round(x * 100) / 100)).toEqual([0, 0, -25, -50, 0, 0, -10]);
    });
    it('never goes positive and handles empty / non-positive input', () => {
        expect(underwater([])).toEqual([]);
        expect(underwater([0, 0])).toEqual([0, 0]);
        expect(underwater([5, 4, 6]).every((x) => x <= 0)).toBe(true);
    });
    it('maps YYYY-MM to fractional years', () => {
        expect(monthToYear('2020-01')).toBe(2020);
        expect(monthToYear('2020-07')).toBe(2020.5);
        expect(monthToYear('2021')).toBe(2021);
        expect(monthToYear('nope')).toBeNaN();
    });
    it('matches the mock episodes\' max drawdown', () => {
        const plan = parseDocuments(MOCK_ROWS).plans.find((p) => p.slug === 'income-example')!;
        const dd = plan.drawdown!;
        for (const k of Object.keys(dd.series)) {
            const worst = Math.min(...underwater(dd.series[k].map((p) => p.value)));
            expect(worst).toBeCloseTo(dd.maxDdPct[k], 0);
        }
    });
});

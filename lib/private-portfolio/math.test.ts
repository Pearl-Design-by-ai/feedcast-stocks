import { describe, expect, it } from 'vitest';
import {
    accountsForScope,
    allocate,
    allocationByCustodian,
    cashUsd,
    compareSlices,
    custodianBucket,
    diffTotals,
    groupDiff,
    planIncomeUsd,
    snapshotAllocation,
} from './math';
import { parseDocuments } from './parse';
import { MOCK_ROWS } from './mock';
import type { DiffRow, Holding, Plan } from './types';

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

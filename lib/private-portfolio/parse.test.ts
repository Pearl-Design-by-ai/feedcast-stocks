import { describe, expect, it } from 'vitest';
import { parseDocuments, parseHolding, parseMonthly, parsePlan, parseSnapshot } from './parse';
import { MOCK_ROWS } from './mock';

describe('parseSnapshot', () => {
    it('parses a valid synthetic snapshot', () => {
        const s = parseSnapshot(MOCK_ROWS[0].payload)!;
        expect(s.accounts).toHaveLength(3);
        expect(s.totals.marketUsd).toBe(2_519_000);
        expect(s.monthlyIncome).toHaveLength(12);
        expect(s.fx.EURUSD).toBe(1.1);
    });

    it('fills defaults for a partial payload', () => {
        const s = parseSnapshot(
            { accounts: [{ name: 'Example', holdings: [{ name: 'Example Bond 5% 2030', valueUsd: '1000' }, { valueUsd: 5 }] }] },
            '2026-01-01T00:00:00Z'
        )!;
        expect(s.asOf).toBe('2026-01-01T00:00:00Z');
        expect(s.accounts[0].holdings).toHaveLength(1); // nameless holding dropped
        expect(s.accounts[0].holdings[0]).toMatchObject({ valueUsd: 1000, ccy: 'USD', group: 'Diğer' });
        expect(s.accounts[0].totalUsd).toBe(1000);
        expect(s.totals).toEqual({ marketUsd: 1000, maturityUsd: 0, annualIncomeUsd: 0 });
        expect(s.monthlyIncome).toEqual(Array(12).fill(0));
        expect(s.allocation).toEqual([]);
    });

    it('rejects garbage without throwing', () => {
        for (const g of [null, undefined, 42, 'x', [], [1, 2]]) expect(parseSnapshot(g)).toBeNull();
        const s = parseSnapshot({ accounts: 'nope', totals: [], fx: { A: 'x', B: Infinity, C: 2 }, monthlyIncome: { a: 1 }, notes: [1, null, 'n'] })!;
        expect(s.accounts).toEqual([]);
        expect(s.fx).toEqual({ C: 2 });
        expect(s.notes).toEqual(['1', 'n']);
    });
});

describe('parseHolding / parseMonthly', () => {
    it('coerces types and drops non-finite numbers', () => {
        expect(parseHolding({ name: 'Example', valueUsd: NaN, couponPct: '5', ytmPct: {} })).toMatchObject({ valueUsd: 0, couponPct: 5, ytmPct: null });
        expect(parseHolding({ name: '' })).toBeNull();
    });
    it('pads/truncates monthly income to 12', () => {
        expect(parseMonthly([1, 2])).toEqual([1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(parseMonthly(Array(20).fill(1))).toHaveLength(12);
        expect(parseMonthly('x')).toBeNull();
    });
});

describe('parsePlan', () => {
    it('parses a valid synthetic plan', () => {
        const p = parsePlan(MOCK_ROWS[1].payload)!;
        expect(p.slug).toBe('income-example');
        expect(p.diff.length).toBeGreaterThan(0);
        expect(p.summary.targetIncomeUsd).toEqual([100_000, 120_000]);
        expect(p.drawdown && Object.keys(p.drawdown.series)).toEqual(['unlevered', 'margin1m', 'margin2m']);
    });

    it('handles partial and garbage plans', () => {
        const p = parsePlan({ diff: [{ action: 'BUY', name: 'Example', amountUsd: -50 }, { action: 'hold', name: 'x' }, 7], account: 'weird', summary: { a: 'x', b: [1, 2], c: 3 } }, { slug: 'fallback' })!;
        expect(p.slug).toBe('fallback');
        expect(p.title).toBe('fallback');
        expect(p.account).toBe('both');
        expect(p.diff).toEqual([expect.objectContaining({ action: 'buy', amountUsd: 50, custodian: 'Diğer' })]);
        expect(p.summary).toEqual({ b: [1, 2], c: 3 });
        expect(p.drawdown).toBeUndefined();
        expect(parsePlan({ title: 'no slug' })).toBeNull();
        expect(parsePlan('garbage')).toBeNull();
    });
});

describe('parseDocuments', () => {
    it('splits snapshot and plans, ignoring unknown rows', () => {
        const d = parseDocuments([...MOCK_ROWS, { kind: 'snapshot', slug: 'old', payload: {} }, { kind: 'other' }, null]);
        expect(d.snapshot?.totals.marketUsd).toBe(2_519_000);
        expect(d.plans.map((p) => p.slug).sort()).toEqual(['growth-example', 'income-example']);
    });
    it('returns an empty model for garbage', () => {
        expect(parseDocuments(null)).toEqual({ snapshot: null, plans: [] });
        expect(parseDocuments({ rows: 1 })).toEqual({ snapshot: null, plans: [] });
    });
});

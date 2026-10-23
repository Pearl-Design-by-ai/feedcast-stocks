import { describe, expect, it } from 'vitest';
import { warmSymbols, rotateForRun, WARM_TOP_N } from './warm-symbols';
import { POPULAR_STOCK_SYMBOLS } from './constants';

describe('warmSymbols', () => {
    it('puts the top popular names first, then appends new owner symbols', () => {
        const out = warmSymbols(['aapl', 'pltr', 'bad sym!', 'PLTR']);
        expect(out.slice(0, WARM_TOP_N)).toEqual(
            [...new Set(POPULAR_STOCK_SYMBOLS.slice(0, WARM_TOP_N).map((s) => s.toUpperCase()))].slice(0, WARM_TOP_N)
        );
        expect(out).toContain('PLTR');
        expect(out.filter((s) => s === 'AAPL')).toHaveLength(1);
        expect(out).not.toContain('BAD SYM!');
    });
});

describe('rotateForRun', () => {
    it('shifts the start by one per 10-minute slot', () => {
        expect(rotateForRun(['a', 'b', 'c'], 0)).toEqual(['a', 'b', 'c']);
        expect(rotateForRun(['a', 'b', 'c'], 600_000)).toEqual(['b', 'c', 'a']);
        expect(rotateForRun([], 600_000)).toEqual([]);
    });
});

import { describe, it, expect } from 'vitest';
import {
    formatSymbolForTradingView,
    formatMarketCapValue,
    formatNumber,
    formatChangePercent,
    validateArticle,
    getDateRange,
} from './utils';

describe('formatSymbolForTradingView', () => {
    it('returns a plain US ticker unchanged (uppercased)', () => {
        expect(formatSymbolForTradingView('aapl')).toBe('AAPL');
    });

    it('maps a Finnhub exchange suffix to the TradingView prefix', () => {
        expect(formatSymbolForTradingView('2330.TW')).toBe('TWSE:2330');
        expect(formatSymbolForTradingView('VOD.L')).toBe('LSE:VOD');
    });

    it('prefers the longer suffix (.TWO over .TW)', () => {
        expect(formatSymbolForTradingView('1234.TWO')).toBe('TPEX:1234');
    });

    it('returns empty string for empty input', () => {
        expect(formatSymbolForTradingView('')).toBe('');
    });
});

describe('formatMarketCapValue', () => {
    it('formats trillions, billions and millions', () => {
        expect(formatMarketCapValue(3.1e12)).toBe('$3.10T');
        expect(formatMarketCapValue(9e11)).toBe('$900.00B');
        expect(formatMarketCapValue(25e6)).toBe('$25.00M');
    });

    it('returns N/A for non-positive or invalid input', () => {
        expect(formatMarketCapValue(0)).toBe('N/A');
        expect(formatMarketCapValue(NaN)).toBe('N/A');
    });
});

describe('formatNumber', () => {
    it('treats input as millions (Finnhub market cap convention)', () => {
        // 3_000_000 (millions) -> 3T
        expect(formatNumber(3_000_000)).toBe('3.00T');
        // 100_000 (millions) -> 100B
        expect(formatNumber(100_000)).toBe('100.00B');
    });
});

describe('formatChangePercent', () => {
    it('adds a + sign for gains and none for losses', () => {
        expect(formatChangePercent(2.5)).toBe('+2.50%');
        expect(formatChangePercent(-1.25)).toBe('-1.25%');
    });

    it('returns empty string when undefined', () => {
        expect(formatChangePercent(undefined)).toBe('');
    });
});

describe('validateArticle', () => {
    const base = { id: 1, headline: 'h', summary: 's', url: 'u', datetime: 123 };

    it('accepts an article with all required fields', () => {
        expect(validateArticle(base)).toBeTruthy();
    });

    it('rejects an article missing required fields', () => {
        expect(validateArticle({ ...base, url: undefined })).toBeFalsy();
    });
});

describe('getDateRange', () => {
    it('returns from/to as YYYY-MM-DD with from before to', () => {
        const { from, to } = getDateRange(5);
        expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(from).getTime()).toBeLessThanOrEqual(new Date(to).getTime());
    });
});

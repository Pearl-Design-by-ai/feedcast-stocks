import { describe, expect, it } from 'vitest';
import { canViewPrivatePortfolio, resolveDevFlags } from './gate';
import { POWER_USER_EMAILS } from '@/lib/constants';

describe('canViewPrivatePortfolio', () => {
    it('rejects a null / anonymous user', () => {
        expect(canViewPrivatePortfolio(null)).toBe(false);
        expect(canViewPrivatePortfolio(undefined)).toBe(false);
        expect(canViewPrivatePortfolio({ email: null })).toBe(false);
    });
    it('rejects a non-power email', () => {
        expect(canViewPrivatePortfolio({ email: 'someone@example.com' })).toBe(false);
    });
    it('allows the power-user account (case-insensitive)', () => {
        expect(canViewPrivatePortfolio({ email: POWER_USER_EMAILS[0] })).toBe(true);
        expect(canViewPrivatePortfolio({ email: POWER_USER_EMAILS[0].toUpperCase() })).toBe(true);
    });
});

describe('resolveDevFlags', () => {
    it('is always off in production', () => {
        expect(resolveDevFlags({ NODE_ENV: 'production', PRIVATE_PORTFOLIO_MOCK: '1', PRIVATE_PORTFOLIO_MOCK_NOAUTH: '1' })).toEqual({ mock: false, noAuth: false });
    });
    it('needs MOCK for NOAUTH to count', () => {
        expect(resolveDevFlags({ NODE_ENV: 'development', PRIVATE_PORTFOLIO_MOCK_NOAUTH: '1' })).toEqual({ mock: false, noAuth: false });
        expect(resolveDevFlags({ NODE_ENV: 'development', PRIVATE_PORTFOLIO_MOCK: '1' })).toEqual({ mock: true, noAuth: false });
        expect(resolveDevFlags({ NODE_ENV: 'development', PRIVATE_PORTFOLIO_MOCK: '1', PRIVATE_PORTFOLIO_MOCK_NOAUTH: '1' })).toEqual({ mock: true, noAuth: true });
    });
});

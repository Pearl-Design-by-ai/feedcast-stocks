/**
 * Access rules for /my-portfolio. Pure (no Next/Supabase imports) so the
 * gate itself is unit-tested.
 */

import { isPowerUserEmail } from '@/lib/constants';

/** Only the power-user account may see the private portfolio. */
export function canViewPrivatePortfolio(user: { email?: string | null } | null | undefined): boolean {
    return !!user && isPowerUserEmail(user.email);
}

export interface PrivatePortfolioDevFlags {
    /** Serve lib/private-portfolio/mock.ts instead of reading the table. */
    mock: boolean;
    /** Additionally skip the power-user gate (local screenshots only). */
    noAuth: boolean;
}

/**
 * Dev-only switches for local previews. Both are hard-off whenever NODE_ENV is
 * 'production', and NOAUTH only counts together with MOCK — so a production
 * build can never serve mock data or skip the gate.
 */
export function resolveDevFlags(env: {
    NODE_ENV?: string;
    PRIVATE_PORTFOLIO_MOCK?: string;
    PRIVATE_PORTFOLIO_MOCK_NOAUTH?: string;
}): PrivatePortfolioDevFlags {
    const mock = env.NODE_ENV !== 'production' && env.PRIVATE_PORTFOLIO_MOCK === '1';
    return { mock, noAuth: mock && env.PRIVATE_PORTFOLIO_MOCK_NOAUTH === '1' };
}

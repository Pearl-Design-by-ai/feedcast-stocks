// Shared constants/types for watchlist groups (importable from both server
// actions and client components — server-action files may only export async).

export const MAX_GROUPS = 5;
/** Power users get a much higher cap than the standard 5 (but not unlimited). */
export const MAX_GROUPS_POWER = 100;

export interface WatchlistGroup {
    id: number;
    name: string;
    position: number;
}

/**
 * A watchlist treated as a one-share-of-each portfolio: how the basket is up or
 * down today. value-weighted by price — changePct = Σ(today's change) / Σ(prior
 * close). Keyed by group id in the map the watchlist page builds.
 */
export interface GroupPortfolio {
    /** Symbols with a usable quote that contributed to the totals. */
    count: number;
    /** Current total value (Σ last price), one share of each holding. */
    value: number;
    /** Today's portfolio change in price terms (Σ change). */
    changeAbs: number;
    /** Today's move as a % of the prior-close total; null when no data. */
    changePct: number | null;
}

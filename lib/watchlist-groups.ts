// Shared constants/types for watchlist groups (importable from both server
// actions and client components — server-action files may only export async).

export const MAX_GROUPS = 5;

export interface WatchlistGroup {
    id: number;
    name: string;
    position: number;
}

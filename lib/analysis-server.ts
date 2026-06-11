// Server helpers shared by the /analysis tool pages.

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { isTickerLike } from '@/lib/utils';

/** The signed-in member's watchlist symbols, for the one-tap picker chips. */
export async function getPickerWatchlist(): Promise<string[]> {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];
        const items = await getUserWatchlist(user.id);
        return items.map((i) => i.symbol).filter(Boolean);
    } catch {
        return [];
    }
}

/** Validated, uppercased `?symbol=` — or null when absent/garbage. */
export function symbolFromParams(params: { symbol?: string | string[] }): string | null {
    const raw = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
    const sym = (raw ?? '').trim().toUpperCase();
    return sym && isTickerLike(sym) ? sym : null;
}

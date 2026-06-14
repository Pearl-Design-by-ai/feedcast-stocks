'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getCompanyProfile } from '@/lib/actions/finnhub.actions';
import { isTickerLike, sanitizeSymbols } from '@/lib/utils';
import { MAX_GROUPS, type WatchlistGroup } from '@/lib/watchlist-groups';

const GROUPS = 'stock_watchlist_groups';
const ITEMS = 'stock_watchlist';

async function sessionUser() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    return { supabase, user };
}

/**
 * The user's watchlist groups, ordered. Auto-creates a default "My Watchlist"
 * the first time a member has none, so the rest of the UI always has a group.
 */
export async function listGroups(): Promise<WatchlistGroup[]> {
    try {
        const { supabase, user } = await sessionUser();
        const { data, error } = await supabase
            .from(GROUPS)
            .select('id, name, position')
            .eq('user_id', user.id)
            .order('position', { ascending: true })
            .order('id', { ascending: true });
        if (error) throw error;

        if (!data || data.length === 0) {
            const { data: created, error: cErr } = await supabase
                .from(GROUPS)
                .insert({ user_id: user.id, name: 'My Watchlist', position: 0 })
                .select('id, name, position')
                .single();
            if (cErr) throw cErr;
            return created ? [created as WatchlistGroup] : [];
        }
        return data as WatchlistGroup[];
    } catch (error) {
        console.error('listGroups error:', error);
        return [];
    }
}

export async function createGroup(name: string): Promise<{ ok: boolean; error?: string; id?: number }> {
    try {
        const trimmed = name.trim().slice(0, 40);
        if (!trimmed) return { ok: false, error: 'Name is required' };
        const { supabase, user } = await sessionUser();

        const { count } = await supabase
            .from(GROUPS)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
        if ((count ?? 0) >= MAX_GROUPS) return { ok: false, error: `You can have at most ${MAX_GROUPS} watchlists.` };

        const { data, error } = await supabase
            .from(GROUPS)
            .insert({ user_id: user.id, name: trimmed, position: count ?? 0 })
            .select('id')
            .single();
        if (error) throw error;
        revalidatePath('/watchlist');
        return { ok: true, id: (data as { id: number }).id };
    } catch (error) {
        console.error('createGroup error:', error);
        return { ok: false, error: 'Could not create the watchlist' };
    }
}

export async function renameGroup(id: number, name: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const trimmed = name.trim().slice(0, 40);
        if (!trimmed) return { ok: false, error: 'Name is required' };
        const { supabase, user } = await sessionUser();
        const { data, error } = await supabase
            .from(GROUPS)
            .update({ name: trimmed })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) return { ok: false, error: 'Watchlist not found' };
        revalidatePath('/watchlist');
        return { ok: true };
    } catch (error) {
        console.error('renameGroup error:', error);
        return { ok: false, error: 'Could not rename' };
    }
}

export async function deleteGroup(id: number): Promise<{ ok: boolean; error?: string }> {
    try {
        const { supabase, user } = await sessionUser();
        const { count } = await supabase
            .from(GROUPS)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
        if ((count ?? 0) <= 1) return { ok: false, error: 'Keep at least one watchlist.' };

        // Rows cascade-delete via the group_id FK.
        const { data, error } = await supabase
            .from(GROUPS)
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) return { ok: false, error: 'Watchlist not found' };
        revalidatePath('/watchlist');
        return { ok: true };
    } catch (error) {
        console.error('deleteGroup error:', error);
        return { ok: false, error: 'Could not delete' };
    }
}

/** Add a symbol to a specific group (resolves the company name from Finnhub). */
export async function addSymbolToGroup(groupId: number, symbol: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const sym = symbol.trim().toUpperCase();
        if (!isTickerLike(sym)) return { ok: false, error: 'Enter a valid ticker' };
        const { supabase, user } = await sessionUser();

        // Confirm the group is the user's (RLS-scoped read).
        const { data: grp } = await supabase.from(GROUPS).select('id').eq('id', groupId).eq('user_id', user.id).maybeSingle();
        if (!grp) return { ok: false, error: 'Watchlist not found' };

        const profile = await getCompanyProfile(sym).catch(() => null);
        const company = profile?.name || sym;

        const { error } = await supabase
            .from(ITEMS)
            .upsert(
                { user_id: user.id, group_id: groupId, symbol: sym, company, added_at: new Date().toISOString() },
                { onConflict: 'group_id,symbol' }
            );
        if (error) throw error;
        revalidatePath('/watchlist');
        return { ok: true };
    } catch (error) {
        console.error('addSymbolToGroup error:', error);
        return { ok: false, error: 'Could not add' };
    }
}

/**
 * Batch-add comma/space/newline-separated tickers to a group in one go.
 * Sanitizes + dedupes + caps at 25, resolves company names with a bounded
 * pool, and upserts them all. Returns how many were added vs. skipped.
 */
export async function addSymbolsToGroup(
    groupId: number,
    raw: string
): Promise<{ ok: boolean; added: number; skipped: number; error?: string }> {
    try {
        const requested = (raw ?? '').split(/[\s,;]+/).filter((t) => t.trim());
        const syms = sanitizeSymbols(requested, 25);
        if (syms.length === 0) return { ok: false, added: 0, skipped: 0, error: 'Enter one or more tickers' };

        const { supabase, user } = await sessionUser();
        const { data: grp } = await supabase.from(GROUPS).select('id').eq('id', groupId).eq('user_id', user.id).maybeSingle();
        if (!grp) return { ok: false, added: 0, skipped: 0, error: 'Watchlist not found' };

        // Resolve company names, 4 in flight (free-tier safe).
        const names = new Map<string, string>();
        let next = 0;
        const worker = async () => {
            while (next < syms.length) {
                const s = syms[next++];
                const profile = await getCompanyProfile(s).catch(() => null);
                names.set(s, profile?.name || s);
            }
        };
        await Promise.all(Array.from({ length: Math.min(4, syms.length) }, worker));

        const now = new Date().toISOString();
        const rows = syms.map((s) => ({
            user_id: user.id,
            group_id: groupId,
            symbol: s,
            company: names.get(s) || s,
            added_at: now,
        }));
        const { error } = await supabase.from(ITEMS).upsert(rows, { onConflict: 'group_id,symbol' });
        if (error) throw error;

        revalidatePath('/watchlist');
        return { ok: true, added: syms.length, skipped: Math.max(0, requested.length - syms.length) };
    } catch (error) {
        console.error('addSymbolsToGroup error:', error);
        return { ok: false, added: 0, skipped: 0, error: 'Could not add' };
    }
}

/**
 * Batch-remove comma/space/newline-separated tickers from a group in one go
 * (mirror of addSymbolsToGroup). Returns how many rows were actually deleted.
 */
export async function removeSymbolsFromGroup(
    groupId: number,
    raw: string
): Promise<{ ok: boolean; removed: number; error?: string }> {
    try {
        const requested = (raw ?? '').split(/[\s,;]+/).filter((t) => t.trim());
        const syms = sanitizeSymbols(requested, 50);
        if (syms.length === 0) return { ok: false, removed: 0, error: 'Enter one or more tickers' };

        const { supabase, user } = await sessionUser();
        const { data, error } = await supabase
            .from(ITEMS)
            .delete()
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .in('symbol', syms)
            .select('symbol');
        if (error) throw error;

        revalidatePath('/watchlist');
        return { ok: true, removed: data?.length ?? 0 };
    } catch (error) {
        console.error('removeSymbolsFromGroup error:', error);
        return { ok: false, removed: 0, error: 'Could not remove' };
    }
}

/** Remove a symbol from one group (the per-row action on the watchlist page). */
export async function removeSymbolFromGroup(groupId: number, symbol: string): Promise<{ ok: boolean }> {
    try {
        const { supabase, user } = await sessionUser();
        const { error } = await supabase
            .from(ITEMS)
            .delete()
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .eq('symbol', symbol.toUpperCase());
        if (error) throw error;
        revalidatePath('/watchlist');
        return { ok: true };
    } catch (error) {
        console.error('removeSymbolFromGroup error:', error);
        return { ok: false };
    }
}

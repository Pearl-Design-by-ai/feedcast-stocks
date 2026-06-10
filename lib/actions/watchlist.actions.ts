'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const TABLE = 'stock_watchlist';

export type WatchlistRow = {
    id: number;
    user_id: string;
    symbol: string;
    company: string;
    added_at: string;
};

// -- CRUD Operations --

// Writes resolve the owner from the session (defense in depth on top of RLS)
// instead of trusting a client-supplied userId.
export async function addToWatchlist(symbol: string, company: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in');

        const { data, error } = await supabase
            .from(TABLE)
            .upsert(
                {
                    user_id: user.id,
                    symbol: symbol.toUpperCase(),
                    company,
                    added_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,symbol' }
            )
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/watchlist');
        return data;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        throw new Error('Failed to add to watchlist');
    }
}

export async function removeFromWatchlist(symbol: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in');

        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol.toUpperCase());

        if (error) throw error;

        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        throw new Error('Failed to remove from watchlist');
    }
}

export async function getUserWatchlist(userId: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) throw error;

        // Map snake_case → camelCase so existing components keep working.
        return (data ?? []).map((row: WatchlistRow) => ({
            id: row.id,
            userId: row.user_id,
            symbol: row.symbol,
            company: row.company,
            addedAt: row.added_at,
        }));
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return [];
    }
}

// Check if a symbol is in the user's watchlist
export async function isStockInWatchlist(userId: string, symbol: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase
            .from(TABLE)
            .select('id')
            .eq('user_id', userId)
            .eq('symbol', symbol.toUpperCase())
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error checking watchlist status:', error);
        return false;
    }
}

// -- Legacy Support (if needed by other components) --

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const admin = getSupabaseAdmin();

        // Resolve the Supabase auth user by email (admin API paginates).
        let userId: string | undefined;
        for (let page = 1; page <= 20 && !userId; page++) {
            const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            if (error) throw error;
            const match = data.users.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase()
            );
            if (match) userId = match.id;
            if (data.users.length < 1000) break;
        }

        if (!userId) return [];

        const { data: items, error: itemsError } = await admin
            .from(TABLE)
            .select('symbol')
            .eq('user_id', userId);

        if (itemsError) throw itemsError;

        return (items ?? []).map((i: { symbol: string }) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

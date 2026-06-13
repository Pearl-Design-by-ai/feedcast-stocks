'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getQuote } from '@/lib/actions/finnhub.actions';

const TABLE = 'stock_alerts';

/**
 * Current price for a symbol, for pre-filling the alert target field so a
 * member can set their threshold relative to where the stock trades now.
 * Returns null when the quote is unavailable. (getQuote is KV-cached.)
 */
export async function getSymbolPrice(symbol: string): Promise<number | null> {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return null;
    try {
        const quote = await getQuote(sym);
        return quote?.c ?? null;
    } catch {
        return null;
    }
}

export type AlertRow = {
    id: number;
    user_id: string;
    symbol: string;
    name: string | null;
    target_price: number;
    condition: 'ABOVE' | 'BELOW';
    active: boolean;
    triggered: boolean;
    expires_at: string;
    created_at: string;
    updated_at: string;
};

// 90 days from now — matches the old Mongoose schema default.
function defaultExpiry(): string {
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
}

function mapAlert(row: AlertRow) {
    return {
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        name: row.name,
        targetPrice: row.target_price,
        condition: row.condition,
        active: row.active,
        triggered: row.triggered,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Resolve the session user — alert writes never trust client-supplied ids
// (defense in depth on top of RLS).
async function requireUser(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    return user;
}

// Create a new alert
export async function createAlert(params: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    name?: string;
}) {
    try {
        if (!params.symbol?.trim()) throw new Error('Symbol is required');
        if (!Number.isFinite(params.targetPrice) || params.targetPrice <= 0)
            throw new Error('Target price must be a positive number');
        if (params.condition !== 'ABOVE' && params.condition !== 'BELOW')
            throw new Error('Invalid condition');

        const supabase = await getSupabaseServerClient();
        const user = await requireUser(supabase);
        // Mirror the client-side maxLength so a crafted request can't bypass it.
        const trimmedName = params.name?.trim().slice(0, 80);
        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                user_id: user.id,
                symbol: params.symbol.toUpperCase(),
                name: trimmedName ? trimmedName : null,
                target_price: params.targetPrice,
                condition: params.condition,
                active: true,
                triggered: false,
                expires_at: defaultExpiry(),
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/watchlist');
        return mapAlert(data as AlertRow);
    } catch (error) {
        console.error('Error creating alert:', error);
        throw new Error('Failed to create alert');
    }
}

// Get all alerts for a user
export async function getUserAlerts(userId: string) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []).map((row: AlertRow) => mapAlert(row));
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

// Delete an alert
export async function deleteAlert(alertId: string | number) {
    try {
        const supabase = await getSupabaseServerClient();
        const user = await requireUser(supabase);
        const { data, error } = await supabase
            .from(TABLE)
            .delete()
            .eq('id', alertId)
            .eq('user_id', user.id)
            .select('id');

        if (error) throw error;
        // RLS rejections surface as 0 affected rows, not an error — without
        // this check the UI would report success on a no-op.
        if (!data || data.length === 0) throw new Error('Alert not found');

        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error deleting alert:', error);
        throw new Error('Failed to delete alert');
    }
}

// Toggle alert active status (optional utility)
export async function toggleAlert(alertId: string | number, active: boolean) {
    try {
        const supabase = await getSupabaseServerClient();
        const user = await requireUser(supabase);
        const { data, error } = await supabase
            .from(TABLE)
            .update({ active, updated_at: new Date().toISOString() })
            .eq('id', alertId)
            .eq('user_id', user.id)
            .select('id');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Alert not found');

        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error toggling alert:', error);
        throw new Error('Failed to update alert');
    }
}

// Re-arm a triggered alert: clear `triggered`, re-activate it and push the
// 90-day expiry window out from now so the cron picks it up again.
export async function reactivateAlert(alertId: string | number) {
    try {
        const supabase = await getSupabaseServerClient();
        const user = await requireUser(supabase);
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                triggered: false,
                active: true,
                notified_at: null,
                expires_at: defaultExpiry(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/watchlist');
        return mapAlert(data as AlertRow);
    } catch (error) {
        console.error('Error reactivating alert:', error);
        throw new Error('Failed to reactivate alert');
    }
}

'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const TABLE = 'stock_alerts';

export type AlertRow = {
    id: number;
    user_id: string;
    symbol: string;
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
        targetPrice: row.target_price,
        condition: row.condition,
        active: row.active,
        triggered: row.triggered,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Create a new alert
export async function createAlert(params: {
    userId: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
}) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data, error } = await supabase
            .from(TABLE)
            .insert({
                user_id: params.userId,
                symbol: params.symbol.toUpperCase(),
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
        const { error } = await supabase.from(TABLE).delete().eq('id', alertId);

        if (error) throw error;

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
        const { error } = await supabase
            .from(TABLE)
            .update({ active, updated_at: new Date().toISOString() })
            .eq('id', alertId);

        if (error) throw error;

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
        const { data, error } = await supabase
            .from(TABLE)
            .update({
                triggered: false,
                active: true,
                expires_at: defaultExpiry(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
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

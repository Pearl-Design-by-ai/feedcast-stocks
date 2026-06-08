'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sanitizeLayout, type DashboardLayout } from '@/lib/dashboard/catalog';

const TABLE = 'markets_dashboard_layouts';

/** Read the signed-in user's saved layout, or null if they have none yet. */
export async function getDashboardLayout(): Promise<DashboardLayout | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select('layout')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data?.layout) return null;
  return sanitizeLayout(data.layout);
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Upsert the signed-in user's layout. Sanitized before persisting. */
export async function saveDashboardLayout(layout: DashboardLayout): Promise<SaveResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const safe = sanitizeLayout(layout);
  const { error } = await supabase.from(TABLE).upsert(
    { user_id: user.id, layout: safe, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  return { ok: true };
}

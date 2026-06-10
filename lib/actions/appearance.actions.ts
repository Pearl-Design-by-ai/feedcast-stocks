'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ACCENT_COLORS, type AccentColorId } from '@/lib/accent';
import { BACKGROUND_TONES, type BackgroundToneId } from '@/lib/appearance';

export interface AppearanceChoice {
  accentColor?: AccentColorId;
  background?: BackgroundToneId;
}

/**
 * Persist the member's appearance picks into
 * `user_preferences.reading_preferences` — the same JSONB the main Feedcast
 * app reads/writes (`accentColor` is shared with it; `marketsBackground` is
 * ours). RLS limits the row to the logged-in user. Existing keys are merged,
 * never clobbered.
 */
export async function saveAppearance(
  choice: AppearanceChoice
): Promise<{ ok: boolean; error?: string }> {
  // 'black' is the main app's "no accent" sentinel — not selectable here.
  if (
    choice.accentColor !== undefined &&
    (choice.accentColor === 'black' || !(choice.accentColor in ACCENT_COLORS))
  ) {
    return { ok: false, error: 'Invalid accent color' };
  }
  if (
    choice.background !== undefined &&
    !BACKGROUND_TONES.some((t) => t.id === choice.background)
  ) {
    return { ok: false, error: 'Invalid background tone' };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { data } = await supabase
    .from('user_preferences')
    .select('reading_preferences')
    .eq('id', user.id)
    .maybeSingle();

  const prefs = {
    ...((data?.reading_preferences as Record<string, unknown>) ?? {}),
    ...(choice.accentColor !== undefined && { accentColor: choice.accentColor }),
    ...(choice.background !== undefined && { marketsBackground: choice.background }),
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ id: user.id, reading_preferences: prefs });

  if (error) return { ok: false, error: error.message };

  // Server-rendered pages pick up the new vars on next navigation.
  revalidatePath('/', 'layout');
  return { ok: true };
}

'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ACCENT_COLORS, type AccentColorId } from '@/lib/accent';
import { BACKGROUND_TONES, LIGHT_TONES, type BackgroundToneId, type LightToneId, type ThemeMode } from '@/lib/appearance';

export interface AppearanceChoice {
  accentColor?: AccentColorId;
  background?: BackgroundToneId;
  lightBackground?: LightToneId;
  theme?: ThemeMode;
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
  if (
    choice.lightBackground !== undefined &&
    !LIGHT_TONES.some((t) => t.id === choice.lightBackground)
  ) {
    return { ok: false, error: 'Invalid light background' };
  }
  if (choice.theme !== undefined && !['dark', 'light', 'auto'].includes(choice.theme)) {
    return { ok: false, error: 'Invalid theme' };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const prefs = {
    ...(choice.accentColor !== undefined && { accentColor: choice.accentColor }),
    ...(choice.background !== undefined && { marketsBackground: choice.background }),
    ...(choice.lightBackground !== undefined && { marketsLightBackground: choice.lightBackground }),
    ...(choice.theme !== undefined && { marketsTheme: choice.theme }),
  };

  // Atomic server-side JSONB merge (see supabase/migrations/005) — a plain
  // read-merge-write here can lose a concurrent writer's keys (rapid clicks,
  // or the main app saving other reading_preferences at the same time).
  // No revalidatePath needed: the picker applies vars instantly client-side
  // and every page is dynamic, so the next SSR reads the fresh row anyway.
  const { error } = await supabase.rpc('merge_reading_preferences', { prefs });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

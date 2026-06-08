/**
 * Accent-color palette shared with the main Feedcast app.
 *
 * The main site (www.feedcast.news) lets members pick an accent color and
 * stores the choice in `user_preferences.reading_preferences.accentColor`
 * (a JSONB column synced across devices). markets.feedcast.news is a separate
 * origin, so it can't read the main site's localStorage — instead the
 * (root) layout reads the logged-in user's row server-side and applies the
 * matching hex to the `--brand` CSS variable. The whole UI is themed off
 * `--brand` (see globals.css: `--color-teal-400: var(--brand)`), so the
 * member's chosen accent follows them here automatically.
 *
 * Keep these hex values in sync with the main app's `web/constants/colors.ts`.
 */

export type AccentColorId =
  | 'black'
  | 'teal'
  | 'terra'
  | 'rose'
  | 'crimson'
  | 'tangerine'
  | 'gold'
  | 'olive'
  | 'moss'
  | 'cobalt'
  | 'lavender';

export const ACCENT_COLORS: Record<AccentColorId, string> = {
  black: '#1C1C1E',
  teal: '#2D9B96',
  terra: '#A0674B',
  rose: '#C27085',
  crimson: '#C03A3A',
  tangerine: '#D4722C',
  gold: '#C8A44E',
  olive: '#A0A040',
  moss: '#6B7345',
  cobalt: '#2D6B96',
  lavender: '#7B6BA1',
};

/** The main site's default accent — used when a member hasn't picked one. */
export const DEFAULT_ACCENT_HEX = ACCENT_COLORS.gold;

/** Resolve an accent id (from Supabase) to a hex string, falling back to gold. */
export function accentHex(id: string | null | undefined): string {
  if (id && id in ACCENT_COLORS) return ACCENT_COLORS[id as AccentColorId];
  return DEFAULT_ACCENT_HEX;
}

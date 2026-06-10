/**
 * Appearance presets for FeedCast Markets — dark-only by design (a light
 * theme reads badly against the charts, so we don't offer one).
 *
 * The whole UI is built on the gray-900/800/700/600 scale, which globals.css
 * maps to the runtime `--surface-*` CSS variables. Each background tone below
 * is one set of values for those variables; the (root) layout injects the
 * member's saved tone as a `:root` override so every page, dialog and portal
 * picks it up. "Obsidian" is the original palette and therefore the default —
 * members who never open the settings see no change.
 *
 * Saved to `user_preferences.reading_preferences.marketsBackground` (same
 * JSONB the main app uses for `accentColor`, so it syncs across devices).
 */

export type BackgroundToneId =
  | 'slate'
  | 'graphite'
  | 'midnight'
  | 'charcoal'
  | 'obsidian'
  | 'onyx';

export interface BackgroundTone {
  id: BackgroundToneId;
  label: string;
  blurb: string;
  /** Values for --surface-900/800/700/600 (page, cards, borders, raised UI). */
  surface: { s900: string; s800: string; s700: string; s600: string };
}

export const BACKGROUND_TONES: BackgroundTone[] = [
  {
    id: 'slate',
    label: 'Slate',
    blurb: 'Blue-gray, the lightest of the set.',
    surface: { s900: '#0F1522', s800: '#1B2436', s700: '#2A364D', s600: '#3C4A66' },
  },
  {
    id: 'graphite',
    label: 'Graphite',
    blurb: 'Soft neutral gray, easy in bright rooms.',
    surface: { s900: '#131418', s800: '#1E2025', s700: '#2C2F36', s600: '#3D4149' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    blurb: 'Deep blue-black, cool and quiet.',
    surface: { s900: '#06080F', s800: '#0E1320', s700: '#1B2233', s600: '#2A3349' },
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    blurb: 'Warm near-black with soft cards.',
    surface: { s900: '#0B0B0C', s800: '#19191B', s700: '#27272A', s600: '#37373C' },
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    blurb: 'The original Markets palette.',
    surface: { s900: '#050505', s800: '#141414', s700: '#212328', s600: '#30333A' },
  },
  {
    id: 'onyx',
    label: 'Onyx',
    blurb: 'True black — best on OLED screens.',
    surface: { s900: '#000000', s800: '#0B0B0B', s700: '#181818', s600: '#262626' },
  },
];

export const DEFAULT_BACKGROUND: BackgroundToneId = 'obsidian';

export function backgroundTone(id: string | null | undefined): BackgroundTone {
  return (
    BACKGROUND_TONES.find((t) => t.id === id) ??
    BACKGROUND_TONES.find((t) => t.id === DEFAULT_BACKGROUND)!
  );
}

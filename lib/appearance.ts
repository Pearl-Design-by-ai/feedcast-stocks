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

// ---------------------------------------------------------------------------
// Light theme — added so the whole app can flip to light (text, surfaces and
// charts). The gray scale is fully tokenized in globals.css; a light theme
// just provides light surfaces + a dark "ink" set, and `--color-white` is
// driven by `--ink-strong` so text-white / from-white / border-white flip too.
// ---------------------------------------------------------------------------

export type ThemeMode = 'dark' | 'light' | 'auto';
export const DEFAULT_THEME: ThemeMode = 'dark';

export type LightToneId = 'pearl' | 'snow' | 'linen' | 'nardo' | 'sage' | 'blush';

export interface LightTone {
  id: LightToneId;
  label: string;
  blurb: string;
  /** Page (s900, lightest) → panels (s800) → borders (s700) → raised (s600). */
  surface: { s900: string; s800: string; s700: string; s600: string };
}

export const LIGHT_TONES: LightTone[] = [
  { id: 'pearl', label: 'Pearl', blurb: 'Soft off-white, easy on the eyes.', surface: { s900: '#FAFAFA', s800: '#F0F0F1', s700: '#E2E3E5', s600: '#CBCDD2' } },
  { id: 'snow', label: 'Snow', blurb: 'Clean, bright white.', surface: { s900: '#FFFFFF', s800: '#F4F4F5', s700: '#E5E5E7', s600: '#D2D3D6' } },
  { id: 'linen', label: 'Linen', blurb: 'Warm paper tone.', surface: { s900: '#FAF6EF', s800: '#F1EADD', s700: '#E3D8C6', s600: '#CFC0A8' } },
  { id: 'nardo', label: 'Nardo Gray', blurb: 'Cool neutral gray.', surface: { s900: '#E9EAEC', s800: '#DEDFE2', s700: '#CCCED3', s600: '#B2B5BC' } },
  { id: 'sage', label: 'Sage', blurb: 'Muted green-gray.', surface: { s900: '#EEF1EB', s800: '#E3E8DD', s700: '#D2DAC8', s600: '#B7C2A8' } },
  { id: 'blush', label: 'Blush', blurb: 'Soft warm pink.', surface: { s900: '#F8EFEF', s800: '#EFE3E3', s700: '#E2D1D1', s600: '#CDB6B6' } },
];

export const DEFAULT_LIGHT: LightToneId = 'pearl';

export function lightTone(id: string | null | undefined): LightTone {
  return LIGHT_TONES.find((t) => t.id === id) ?? LIGHT_TONES.find((t) => t.id === DEFAULT_LIGHT)!;
}

// Fixed "ink" sets — text grays, deepest/lightest insets, the white→ink lever
// and the chart theme flag. Surfaces are merged in per chosen tone.
const DARK_INK: Record<string, string> = {
  '--gx-50': '#f9fafb', '--gx-100': '#f3f4f6', '--gx-200': '#e5e7eb', '--gx-300': '#d1d5db',
  '--gx-400': '#CCDADC', '--gx-500': '#9095A1', '--gx-950': '#030712',
  '--ink-strong': '#ffffff', '--tv-theme': 'dark',
  // Caution/disclaimer accent — amber reads well on dark…
  '--warn': '#FACC15',
  // Caution band accent (bubble risk amber) — vivid amber on dark…
  '--caution': '#fbbf24',
  // Symbol/tag chip accent — light blue on dark.
  '--tag': '#93c5fd',
  // Light-teal accent text (active tabs, "+ Add", links) — mint on dark.
  '--teal-300': '#5eead4', '--teal-200': '#99f6e4', '--teal-100': '#ccfbf1',
  // Positive/up green — vivid on dark.
  '--up': '#4ade80', '--up-bg': '#22c55e',
  // Negative/down red — vivid on dark.
  '--down': '#f87171', '--down-bg': '#FF495B',
};
const LIGHT_INK: Record<string, string> = {
  '--gx-50': '#0a0a0a', '--gx-100': '#18181b', '--gx-200': '#27272a', '--gx-300': '#3f3f46',
  '--gx-400': '#52525b', '--gx-500': '#6b7280', '--gx-950': '#ffffff',
  '--ink-strong': '#111827', '--tv-theme': 'light',
  // …but washes out on light, so the disclaimer goes red there.
  '--warn': '#DC2626',
  // …amber washes out on light too, so the caution band goes deep orange.
  '--caution': '#C2410C',
  // Deep blue on light so symbol/tag chips stay readable.
  '--tag': '#1d4ed8',
  // Mint teal washes out on light, so accent text goes deep teal there.
  '--teal-300': '#0f766e', '--teal-200': '#0d9488', '--teal-100': '#115e59',
  // Deep green on light so positive numbers stay readable.
  '--up': '#15803d', '--up-bg': '#16a34a',
  // Deep red on light so negative numbers stay readable.
  '--down': '#b91c1c', '--down-bg': '#dc2626',
};

function surfMap(s: { s900: string; s800: string; s700: string; s600: string }): Record<string, string> {
  return { '--surface-900': s.s900, '--surface-800': s.s800, '--surface-700': s.s700, '--surface-600': s.s600 };
}

/** Full CSS-var map for a theme — used by the client live preview. */
export function darkVarMap(darkId: string | null | undefined): Record<string, string> {
  return { ...DARK_INK, ...surfMap(backgroundTone(darkId).surface) };
}
export function lightVarMap(lightId: string | null | undefined): Record<string, string> {
  return { ...LIGHT_INK, ...surfMap(lightTone(lightId).surface) };
}

function mapToCss(map: Record<string, string>): string {
  return Object.entries(map).map(([k, v]) => `${k}:${v};`).join('');
}

/**
 * The `:root` CSS the (root) layout injects. Dark and light both set the full
 * scale; `auto` ships dark by default with a light override under
 * `prefers-color-scheme: light`, so the device decides with no JS/flash.
 */
export function buildThemeCss(
  mode: ThemeMode,
  darkId: string | null | undefined,
  lightId: string | null | undefined,
  brand: string
): string {
  const accent = `--brand:${brand};--brand-hover:${brand}CC;`;
  const dark = `:root{${accent}${mapToCss(darkVarMap(darkId))}}`;
  const light = `:root{${accent}${mapToCss(lightVarMap(lightId))}}`;
  if (mode === 'light') return light;
  if (mode === 'auto') return `${dark}@media (prefers-color-scheme: light){${light}}`;
  return dark;
}

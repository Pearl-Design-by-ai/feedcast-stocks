'use client';

/**
 * Appearance picker — theme mode (Dark / Light / Auto), background tone for the
 * active mode, and accent color. Selections apply instantly by mirroring the
 * theme CSS variables onto document.documentElement, then persist via
 * saveAppearance so they follow the member across devices. On a failed save the
 * previous choice is restored.
 */

import { useState } from 'react';
import { Check, Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';
import { saveAppearance } from '@/lib/actions/appearance.actions';
import { ACCENT_COLORS, type AccentColorId } from '@/lib/accent';
import {
  BACKGROUND_TONES,
  LIGHT_TONES,
  darkVarMap,
  lightVarMap,
  type BackgroundToneId,
  type LightToneId,
  type ThemeMode,
} from '@/lib/appearance';
import { cn } from '@/lib/utils';

const ACCENT_CHOICES = (Object.keys(ACCENT_COLORS) as AccentColorId[]).filter((id) => id !== 'black');

function applyVars(vars: Record<string, string>) {
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function deviceIsLight() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** Live-preview the full var set for the chosen mode (auto resolves to the device). */
function applyTheme(theme: ThemeMode, darkId: BackgroundToneId, lightId: LightToneId) {
  const light = theme === 'light' || (theme === 'auto' && deviceIsLight());
  applyVars(light ? lightVarMap(lightId) : darkVarMap(darkId));
}

function applyAccent(id: AccentColorId) {
  const hex = ACCENT_COLORS[id];
  applyVars({ '--brand': hex, '--brand-hover': `${hex}CC` });
}

const MODES: { id: ThemeMode; label: string; Icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'auto', label: 'Auto', Icon: MonitorSmartphone },
];

export default function AppearanceSettings({
  initialAccent,
  initialBackground,
  initialLightBackground,
  initialTheme,
}: {
  initialAccent: AccentColorId;
  initialBackground: BackgroundToneId;
  initialLightBackground: LightToneId;
  initialTheme: ThemeMode;
}) {
  const [accent, setAccent] = useState<AccentColorId>(initialAccent);
  const [background, setBackground] = useState<BackgroundToneId>(initialBackground);
  const [lightBackground, setLightBackground] = useState<LightToneId>(initialLightBackground);
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  const pickTheme = async (id: ThemeMode) => {
    const prev = theme;
    if (id === prev) return;
    setTheme(id);
    applyTheme(id, background, lightBackground);
    const res = await saveAppearance({ theme: id });
    if (!res.ok) {
      setTheme(prev);
      applyTheme(prev, background, lightBackground);
      toast.error('Could not save the theme', { description: res.error });
    } else {
      toast.success(`Theme set to ${id === 'auto' ? 'Auto (device)' : id} — synced with Feedcast`);
    }
  };

  const pickBackground = async (id: BackgroundToneId) => {
    const prev = background;
    if (id === prev) return;
    setBackground(id);
    applyTheme(theme, id, lightBackground);
    const res = await saveAppearance({ background: id });
    if (!res.ok) {
      setBackground(prev);
      applyTheme(theme, prev, lightBackground);
      toast.error('Could not save the background', { description: res.error });
    } else {
      toast.success(`Dark background set to ${BACKGROUND_TONES.find((t) => t.id === id)?.label}`);
    }
  };

  const pickLightBackground = async (id: LightToneId) => {
    const prev = lightBackground;
    if (id === prev) return;
    setLightBackground(id);
    applyTheme(theme, background, id);
    const res = await saveAppearance({ lightBackground: id });
    if (!res.ok) {
      setLightBackground(prev);
      applyTheme(theme, background, prev);
      toast.error('Could not save the light background', { description: res.error });
    } else {
      toast.success(`Light background set to ${LIGHT_TONES.find((t) => t.id === id)?.label}`);
    }
  };

  const pickAccent = async (id: AccentColorId) => {
    const prev = accent;
    if (id === prev) return;
    setAccent(id);
    applyAccent(id);
    const res = await saveAppearance({ accentColor: id });
    if (!res.ok) {
      setAccent(prev);
      applyAccent(prev);
      toast.error('Could not save the accent color', { description: res.error });
    } else {
      toast.success('Accent color saved — it follows you on Feedcast too');
    }
  };

  const showDark = theme !== 'light';
  const showLight = theme !== 'dark';

  const Swatch = ({
    tone,
    selected,
    onClick,
    labelColor,
    blurbColor,
  }: {
    tone: { id: string; label: string; blurb: string; surface: { s900: string; s800: string; s700: string; s600: string } };
    selected: boolean;
    onClick: () => void;
    labelColor: string;
    blurbColor: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn('flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors', selected ? 'border-teal-400 ring-1 ring-teal-400/50' : 'border-gray-700 hover:border-gray-600')}
      style={{ backgroundColor: tone.surface.s900 }}
    >
      <div className="flex h-14 w-full flex-col justify-center gap-1.5 rounded-md px-3" style={{ backgroundColor: tone.surface.s800 }}>
        <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: tone.surface.s600 }} />
        <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: tone.surface.s700 }} />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-medium" style={{ color: selected ? '#14b8a6' : labelColor }}>{tone.label}</span>
        {selected && <Check size={14} style={{ color: '#14b8a6' }} />}
      </div>
      <span className="text-[11px] leading-snug" style={{ color: blurbColor }}>{tone.blurb}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Theme mode */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
        <h2 className="text-base font-semibold text-gray-100">Theme</h2>
        <p className="mt-0.5 mb-4 text-xs text-gray-500">
          Light, dark, or follow your device. The whole app — text, surfaces and charts — retints instantly.
        </p>
        <div className="flex flex-wrap gap-2">
          {MODES.map(({ id, label, Icon }) => {
            const selected = id === theme;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickTheme(id)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  selected ? 'border-teal-400 bg-teal-500/15 text-teal-300' : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                )}
              >
                <Icon size={16} /> {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Light background presets */}
      {showLight && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
          <h2 className="text-base font-semibold text-gray-100">Light Background</h2>
          <p className="mt-0.5 mb-4 text-xs text-gray-500">Used in light mode (and in auto when your device is light).</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {LIGHT_TONES.map((tone) => (
              <Swatch key={tone.id} tone={tone} selected={tone.id === lightBackground} onClick={() => pickLightBackground(tone.id)} labelColor="#3f3f46" blurbColor="#6b7280"/>
            ))}
          </div>
        </section>
      )}

      {/* Dark background presets */}
      {showDark && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
          <h2 className="text-base font-semibold text-gray-100">Dark Background</h2>
          <p className="mt-0.5 mb-4 text-xs text-gray-500">Used in dark mode (and in auto when your device is dark).</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {BACKGROUND_TONES.map((tone) => (
              <Swatch key={tone.id} tone={tone} selected={tone.id === background} onClick={() => pickBackground(tone.id)} labelColor="#d1d5db" blurbColor="#9095A1"/>
            ))}
          </div>
        </section>
      )}

      {/* Accent */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
        <h2 className="text-base font-semibold text-gray-100">Accent Color</h2>
        <p className="mt-0.5 mb-4 text-xs text-gray-500">
          Tints links, buttons and highlights — shared with your www.feedcast.news profile.
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_CHOICES.map((id) => {
            const selected = id === accent;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickAccent(id)}
                aria-pressed={selected}
                title={id}
                className={cn('flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 transition-colors', selected ? 'border-teal-400 ring-1 ring-teal-400/50' : 'border-gray-700 hover:border-gray-600')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT_COLORS[id] }}>
                  {selected && <Check size={14} className="text-gray-900" strokeWidth={3} />}
                </span>
                <span className={cn('text-xs font-medium capitalize', selected ? 'text-teal-400' : 'text-gray-400')}>{id}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-gray-500">
        Light mode flips the whole site — text, cards, borders and the TradingView charts. Auto follows
        your device&apos;s appearance. Price up/down colors stay green/red in both themes.
      </p>
    </div>
  );
}

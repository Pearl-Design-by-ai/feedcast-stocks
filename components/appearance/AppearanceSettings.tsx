'use client';

/**
 * Appearance picker — background tone (shades of black) + accent color.
 * Selections apply instantly by mirroring the theme CSS variables onto
 * document.documentElement (inline beats the layout's injected :root rule),
 * then persist via the saveAppearance server action so they follow the
 * member across devices. On a failed save the previous choice is restored.
 */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { saveAppearance } from '@/lib/actions/appearance.actions';
import { ACCENT_COLORS, type AccentColorId } from '@/lib/accent';
import { BACKGROUND_TONES, backgroundTone, type BackgroundToneId } from '@/lib/appearance';
import { cn } from '@/lib/utils';

// All accents except 'black' — that's the main app's "no accent" sentinel and
// it disappears against the dark surfaces here.
const ACCENT_CHOICES = (Object.keys(ACCENT_COLORS) as AccentColorId[]).filter(
  (id) => id !== 'black'
);

function applyVars(vars: Record<string, string>) {
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function applyBackground(id: BackgroundToneId) {
  const t = backgroundTone(id);
  applyVars({
    '--surface-900': t.surface.s900,
    '--surface-800': t.surface.s800,
    '--surface-700': t.surface.s700,
    '--surface-600': t.surface.s600,
  });
}

function applyAccent(id: AccentColorId) {
  const hex = ACCENT_COLORS[id];
  applyVars({ '--brand': hex, '--brand-hover': `${hex}CC` });
}

export default function AppearanceSettings({
  initialAccent,
  initialBackground,
}: {
  initialAccent: AccentColorId;
  initialBackground: BackgroundToneId;
}) {
  const [accent, setAccent] = useState<AccentColorId>(initialAccent);
  const [background, setBackground] = useState<BackgroundToneId>(initialBackground);

  const pickBackground = async (id: BackgroundToneId) => {
    const prev = background;
    if (id === prev) return;
    setBackground(id);
    applyBackground(id);
    const res = await saveAppearance({ background: id });
    if (!res.ok) {
      setBackground(prev);
      applyBackground(prev);
      toast.error('Could not save the background', { description: res.error });
    } else {
      toast.success(`Background set to ${backgroundTone(id).label}`);
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

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
        <h2 className="text-base font-semibold text-gray-100">Dark Background</h2>
        <p className="mt-0.5 mb-4 text-xs text-gray-500">
          Choose a background style. Every page, card and menu retints instantly.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BACKGROUND_TONES.map((tone) => {
            const selected = tone.id === background;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => pickBackground(tone.id)}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors',
                  selected
                    ? 'border-teal-400 ring-1 ring-teal-400/50'
                    : 'border-gray-700 hover:border-gray-600'
                )}
                style={{ backgroundColor: tone.surface.s900 }}
              >
                {/* Mini preview card in the tone's own surfaces. */}
                <div
                  className="flex h-14 w-full flex-col justify-center gap-1.5 rounded-md px-3"
                  style={{ backgroundColor: tone.surface.s800 }}
                >
                  <div
                    className="h-1.5 w-3/4 rounded-full"
                    style={{ backgroundColor: tone.surface.s600 }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded-full"
                    style={{ backgroundColor: tone.surface.s700 }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      selected ? 'text-teal-400' : 'text-gray-300'
                    )}
                  >
                    {tone.label}
                  </span>
                  {selected && <Check size={14} className="text-teal-400" />}
                </div>
                <span className="text-[11px] leading-snug text-gray-500">{tone.blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

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
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 transition-colors',
                  selected
                    ? 'border-teal-400 ring-1 ring-teal-400/50'
                    : 'border-gray-700 hover:border-gray-600'
                )}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: ACCENT_COLORS[id] }}
                >
                  {selected && <Check size={14} className="text-gray-900" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium capitalize',
                    selected ? 'text-teal-400' : 'text-gray-400'
                  )}
                >
                  {id}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-gray-500">
        FeedCast Markets is dark-only by design — charts, heatmaps and price colors are tuned
        for dark surfaces, and a light theme reads poorly against them. The tones above cover
        the comfortable range from soft slate to true black instead.
      </p>
    </div>
  );
}

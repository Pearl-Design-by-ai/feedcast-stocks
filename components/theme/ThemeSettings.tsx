'use client';

import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon, Check } from 'lucide-react';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

const OPTIONS: Array<{
    value: Theme;
    label: string;
    description: string;
    icon: typeof Monitor;
}> = [
    {
        value: 'system',
        label: 'Default',
        description: 'Match your device — switches automatically with your OS setting.',
        icon: Monitor,
    },
    {
        value: 'light',
        label: 'Light',
        description: 'Always use the light appearance.',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Dark',
        description: 'Always use the dark appearance.',
        icon: Moon,
    },
];

export default function ThemeSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // The chosen theme is only known after hydration (it lives in localStorage),
    // so defer the active highlight until mounted to avoid a mismatch.
    useEffect(() => setMounted(true), []);

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
            {OPTIONS.map(({ value, label, description, icon: Icon }) => {
                const active = mounted && theme === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTheme(value)}
                        className={cn(
                            'group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors',
                            active
                                ? 'border-teal-500 bg-teal-500/10'
                                : 'border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/60'
                        )}
                    >
                        {active && (
                            <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-gray-900">
                                <Check className="h-3.5 w-3.5" />
                            </span>
                        )}
                        <span
                            className={cn(
                                'inline-flex h-10 w-10 items-center justify-center rounded-lg',
                                active ? 'bg-teal-500/20 text-teal-300' : 'bg-gray-800 text-gray-400'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </span>
                        <span className="flex flex-col gap-1">
                            <span className="text-base font-semibold text-gray-100">{label}</span>
                            <span className="text-sm text-gray-400">{description}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

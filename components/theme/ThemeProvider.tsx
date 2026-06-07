'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'fc-theme';

interface ThemeContextValue {
    theme: Theme; // the user's choice (incl. "system")
    resolved: ResolvedTheme; // what's actually applied right now
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'system',
    resolved: 'dark',
    setTheme: () => {},
});

function systemPrefersDark(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
}

/** Apply a theme to <html> and return the resolved light/dark value. */
function applyTheme(theme: Theme): ResolvedTheme {
    const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    return isDark ? 'dark' : 'light';
}

/**
 * Lightweight theme manager (no dependency). The pre-paint inline script in the
 * root layout sets the initial class to avoid a flash; this provider keeps it in
 * sync with the user's choice, persists it, and follows the OS in "system" mode.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolved, setResolved] = useState<ResolvedTheme>('dark');

    // Hydrate from storage on mount.
    useEffect(() => {
        const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'system';
        setThemeState(stored);
        setResolved(applyTheme(stored));
    }, []);

    // Follow the OS while in "system" mode.
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            const current = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'system';
            if (current === 'system') setResolved(applyTheme('system'));
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const setTheme = useCallback((next: Theme) => {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        setThemeState(next);
        setResolved(applyTheme(next));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Inline, render-blocking script that applies the saved theme before first
 * paint (prevents a light/dark flash). Injected in <head> via the root layout.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

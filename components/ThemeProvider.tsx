'use client';

/**
 * Provides the effective UI theme ('light' | 'dark') to client components that
 * can't read it from CSS — notably the TradingView embeds, which need a
 * concrete colorTheme. The mode comes from the server (the member's saved
 * `theme`, shared with the main app); 'auto' is resolved on the client via
 * prefers-color-scheme.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '@/lib/appearance';

type Effective = 'light' | 'dark';

const ThemeContext = createContext<Effective>('dark');

export function useEffectiveTheme(): Effective {
    return useContext(ThemeContext);
}

export default function ThemeProvider({
    mode,
    children,
}: {
    mode: ThemeMode;
    children: React.ReactNode;
}) {
    const [effective, setEffective] = useState<Effective>(mode === 'light' ? 'light' : 'dark');

    useEffect(() => {
        if (mode !== 'auto') {
            setEffective(mode);
            return;
        }
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const apply = () => setEffective(mq.matches ? 'light' : 'dark');
        apply();
        mq.addEventListener?.('change', apply);
        return () => mq.removeEventListener?.('change', apply);
    }, [mode]);

    return <ThemeContext.Provider value={effective}>{children}</ThemeContext.Provider>;
}

/**
 * The theme to feed TradingView embeds. Reads the authoritative `--tv-theme`
 * CSS token live from the document — the same flag buildThemeCss() emits and the
 * /appearance live-preview mirrors — so the chart always matches what's actually
 * on screen: theme changes after a client-side navigation (where the
 * server-rendered context would otherwise be stale), the live preview, and
 * `auto` via the prefers-color-scheme media query. The provider context is the
 * SSR fallback so the first paint is correct with no flash.
 */
export function useChartTheme(): Effective {
    const fallback = useContext(ThemeContext);
    const [theme, setTheme] = useState<Effective>(fallback);

    useEffect(() => {
        const read = () => {
            try {
                const v = getComputedStyle(document.documentElement).getPropertyValue('--tv-theme').trim();
                if (v === 'light' || v === 'dark') setTheme(v);
            } catch {
                /* keep the fallback */
            }
        };
        read();
        // Re-read when the theme can change without a full reload: the OS scheme
        // (auto), the live-preview inline vars, or a re-injected <style>.
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        mq.addEventListener?.('change', read);
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
        observer.observe(document.head, { childList: true, subtree: true });
        return () => {
            mq.removeEventListener?.('change', read);
            observer.disconnect();
        };
    }, []);

    return theme;
}

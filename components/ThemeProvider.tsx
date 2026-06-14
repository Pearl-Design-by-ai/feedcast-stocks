'use client';

/**
 * Provides the effective UI theme ('light' | 'dark') to client components that
 * can't read it from CSS — notably the TradingView embeds, which need a
 * concrete colorTheme. The mode comes from the server (the member's saved
 * marketsTheme); 'auto' is resolved on the client via prefers-color-scheme.
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

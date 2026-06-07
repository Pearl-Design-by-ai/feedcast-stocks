'use client';

import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import {
    MINI_SYMBOL_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from '@/lib/constants';
import type { CountryEtf } from '@/lib/world-indices';

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const MINI_HEIGHT = 180;
const GAUGE_HEIGHT = 400;
const TOTAL = MINI_HEIGHT + GAUGE_HEIGHT;

/**
 * One country/region ETF: a compact price line plus a Technical Analysis gauge
 * that rolls the key indicators into a Buy–Sell "market view". Both widgets
 * lazy-mount when the card scrolls near the viewport.
 */
export default function WorldEtfCard({ etf }: { etf: CountryEtf }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-100">{etf.name}</h3>
                <span className="text-xs text-gray-500">{etf.code}</span>
            </div>

            <div ref={ref} style={{ minHeight: TOTAL }}>
                {visible ? (
                    <div className="flex flex-col gap-3">
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}mini-symbol-overview.js`}
                            config={MINI_SYMBOL_WIDGET_CONFIG(etf.symbol)}
                            height={MINI_HEIGHT}
                        />
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}technical-analysis.js`}
                            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(etf.symbol)}
                            height={GAUGE_HEIGHT}
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-center rounded-lg bg-gray-900/60 text-sm text-gray-600"
                        style={{ height: TOTAL }}
                    >
                        Loading {etf.name}…
                    </div>
                )}
            </div>
        </div>
    );
}

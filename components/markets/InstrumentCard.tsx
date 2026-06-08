'use client';

import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import IndicatorExplainButton from '@/components/market-indicators/IndicatorExplainButton';
import {
    MINI_SYMBOL_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from '@/lib/constants';

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';
const MINI_HEIGHT = 180;
// The Technical Analysis gauge (tabs + gauge + Sell/Neutral/Buy counts + logo)
// needs ~480px; anything shorter makes the cross-origin iframe show its own
// scrollbars (which we can't style away). Give it room so nothing scrolls.
const GAUGE_HEIGHT = 500;
const TOTAL = MINI_HEIGHT + GAUGE_HEIGHT;

/**
 * Reusable symbol card: a compact price line plus a Technical Analysis gauge
 * that rolls the key indicators into a Buy–Sell rating ("market view"). Both
 * widgets lazy-mount when the card scrolls near the viewport.
 */
export default function InstrumentCard({
    title,
    subtitle,
    symbol,
    category,
}: {
    title: string;
    subtitle?: string;
    symbol: string;
    /** When set, shows the AI explainer button and tags the explanation. */
    category?: string;
}) {
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
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-100">{title}</h3>
                <div className="flex items-center gap-2">
                    {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
                    {category && (
                        <IndicatorExplainButton
                            name={subtitle ? `${title} (${subtitle})` : title}
                            blurb={title}
                            category={category}
                        />
                    )}
                </div>
            </div>

            <div ref={ref} style={{ minHeight: TOTAL }}>
                {visible ? (
                    <div className="flex flex-col gap-3">
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}mini-symbol-overview.js`}
                            config={MINI_SYMBOL_WIDGET_CONFIG(symbol)}
                            height={MINI_HEIGHT}
                        />
                        <TradingViewWidget
                            scriptUrl={`${SCRIPT}technical-analysis.js`}
                            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                            height={GAUGE_HEIGHT}
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-center rounded-lg bg-gray-900/60 text-sm text-gray-600"
                        style={{ height: TOTAL }}
                    >
                        Loading {title}…
                    </div>
                )}
            </div>
        </div>
    );
}

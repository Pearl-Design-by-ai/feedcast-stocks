'use client';

import { useState } from 'react';
import { INDICATOR_CATEGORIES } from '@/lib/market-indicators';
import IndicatorCard from '@/components/market-indicators/IndicatorCard';
import { cn } from '@/lib/utils';

/**
 * Market Indicators section — 40 indicators across seven categories, rendered
 * as TradingView charts. Categories are tabbed so only the active group's
 * widgets are in the DOM at a time (cards within a tab lazy-load on scroll).
 */
export default function MarketIndicators() {
    const [activeId, setActiveId] = useState(INDICATOR_CATEGORIES[0].id);
    const active =
        INDICATOR_CATEGORIES.find((c) => c.id === activeId) ?? INDICATOR_CATEGORIES[0];

    return (
        <div className="flex w-full flex-col gap-6">
            {/* Category tabs */}
            <nav
                className="flex flex-wrap gap-2 border-b border-gray-800 pb-3"
                aria-label="Indicator categories"
            >
                {INDICATOR_CATEGORIES.map((cat) => {
                    const isActive = cat.id === active.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveId(cat.id)}
                            aria-pressed={isActive}
                            className={cn(
                                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-teal-500/15 text-teal-300'
                                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                            )}
                        >
                            {cat.label}
                            <span className="ml-1.5 text-xs text-gray-500">
                                {cat.indicators.length}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Active category */}
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-gray-100">{active.label}</h2>
                <p className="text-sm text-gray-400">{active.blurb}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {active.indicators.map((indicator) => (
                    <IndicatorCard key={indicator.num} indicator={indicator} />
                ))}
            </div>
        </div>
    );
}

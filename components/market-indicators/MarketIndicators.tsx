'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IndicatorCategory } from '@/lib/market-indicators';
import IndicatorCard from '@/components/market-indicators/IndicatorCard';
import { cn } from '@/lib/utils';

/**
 * Market Indicators — 40 indicators across seven categories, presented as a
 * collapsible accordion. Tapping a category header expands its indicators below
 * it (one open at a time), which is easier to navigate on mobile and keeps only
 * the open category's charts mounted (cards also lazy-load on scroll).
 *
 * The curated catalog is served by the PRIVATE markets-engine and passed in by
 * the (server) page.
 */
export default function MarketIndicators({ categories }: { categories: IndicatorCategory[] }) {
    // Start fully collapsed; one category opens at a time.
    const [openId, setOpenId] = useState<string>('');

    return (
        <div className="flex w-full flex-col gap-3">
            {categories.map((cat) => {
                const isOpen = openId === cat.id;
                const panelId = `indicator-panel-${cat.id}`;

                return (
                    <div
                        key={cat.id}
                        className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30"
                    >
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? '' : cat.id)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-800/50"
                        >
                            <span className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-100">
                                        {cat.label}
                                    </span>
                                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                        {cat.indicators.length}
                                    </span>
                                </span>
                                <span className="text-sm text-gray-500">{cat.blurb}</span>
                            </span>
                            <ChevronDown
                                className={cn(
                                    'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200',
                                    isOpen && 'rotate-180'
                                )}
                            />
                        </button>

                        {isOpen && (
                            <div
                                id={panelId}
                                className="border-t border-gray-800 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-300 ease-out"
                            >
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    {cat.indicators.map((indicator) => (
                                        <IndicatorCard
                                            key={indicator.num}
                                            indicator={indicator}
                                            category={cat.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

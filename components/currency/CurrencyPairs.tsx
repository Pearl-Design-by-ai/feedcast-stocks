'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CURRENCY_GROUPS } from '@/lib/currencies';
import InstrumentCard from '@/components/markets/InstrumentCard';
import { cn } from '@/lib/utils';

/**
 * Region-grouped accordion of USD currency pairs. One region open at a time
 * (Major Pairs by default), so only the open group's widgets mount; cards
 * lazy-load on scroll. Panels open with a soft fade/slide.
 */
export default function CurrencyPairs() {
    const [openId, setOpenId] = useState<string>(CURRENCY_GROUPS[0].id);

    return (
        <div className="flex w-full flex-col gap-3">
            {CURRENCY_GROUPS.map((group) => {
                const isOpen = openId === group.id;
                const panelId = `currency-panel-${group.id}`;

                return (
                    <div
                        key={group.id}
                        className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30"
                    >
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? '' : group.id)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-800/50"
                        >
                            <span className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-100">
                                        {group.label}
                                    </span>
                                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                        {group.pairs.length}
                                    </span>
                                </span>
                                <span className="text-sm text-gray-500">{group.blurb}</span>
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
                                    {group.pairs.map((pair) => (
                                        <InstrumentCard
                                            key={pair.symbol}
                                            title={pair.code}
                                            subtitle={pair.name}
                                            symbol={pair.symbol}
                                            category="Currency"
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

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WORLD_GROUPS } from '@/lib/world-indices';
import WorldEtfCard from '@/components/world/WorldEtfCard';
import { cn } from '@/lib/utils';

/**
 * Region-grouped accordion of country/region ETFs. One region open at a time
 * (US & Global by default); only the open group's widgets mount and cards
 * lazy-load on scroll. Panels open with a soft fade/slide.
 */
export default function WorldEtfs() {
    const [openId, setOpenId] = useState<string>(WORLD_GROUPS[0].id);

    return (
        <div className="flex w-full flex-col gap-3">
            {WORLD_GROUPS.map((group) => {
                const isOpen = openId === group.id;
                const panelId = `world-panel-${group.id}`;

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
                                        {group.etfs.length}
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
                                    {group.etfs.map((etf) => (
                                        <WorldEtfCard key={etf.symbol} etf={etf} />
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

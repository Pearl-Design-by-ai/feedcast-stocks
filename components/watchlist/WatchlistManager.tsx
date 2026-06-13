'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import WatchlistTable from './WatchlistTable';
import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpZA, ArrowUpDown } from 'lucide-react';
import type { WatchlistStockData } from '@/lib/actions/finnhub.actions';

interface WatchlistItem {
    id?: number;
    userId: string;
    symbol: string;
    company: string;
    addedAt: string | Date;
}

interface WatchlistManagerProps {
    initialItems: WatchlistItem[];
    initialData: WatchlistStockData[];
    groupId?: number;
}

function sortBySymbol<T extends { symbol: string }>(list: T[], order: 'asc' | 'desc' | null): T[] {
    if (!order) return list;
    return [...list].sort((a, b) =>
        order === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol)
    );
}

/**
 * The list IS the manager: alerts and removal live on each table row /
 * mobile card, so there's no separate chips wall — just a slim toolbar
 * (count + sort) above the table.
 */
export default function WatchlistManager({ initialItems, initialData, groupId }: WatchlistManagerProps) {
    const router = useRouter();
    // Sort state: 'asc' (A-Z), 'desc' (Z-A), or null (added order/default)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const sortedData = useMemo(
        () => sortBySymbol(initialData, sortOrder),
        [initialData, sortOrder]
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Symbols
                    <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                        {initialItems.length}
                    </span>
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSort}
                    className="h-8 px-2 text-gray-400 hover:text-white hover:bg-white/10"
                    title={
                        sortOrder === 'asc'
                            ? 'Sorted A-Z'
                            : sortOrder === 'desc'
                                ? 'Sorted Z-A'
                                : 'Default Order'
                    }
                >
                    {sortOrder === 'asc' && <ArrowDownAZ className="w-4 h-4 mr-2" />}
                    {sortOrder === 'desc' && <ArrowUpZA className="w-4 h-4 mr-2" />}
                    {sortOrder === null && <ArrowUpDown className="w-4 h-4 mr-2" />}
                    <span className="text-xs">
                        {sortOrder === 'asc' ? 'A-Z' : sortOrder === 'desc' ? 'Z-A' : 'Sort'}
                    </span>
                </Button>
            </div>

            <WatchlistTable data={sortedData} groupId={groupId} onRefresh={() => router.refresh()} />
        </div>
    );
}

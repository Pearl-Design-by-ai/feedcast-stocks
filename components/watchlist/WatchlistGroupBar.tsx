'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    createGroup,
    renameGroup,
    deleteGroup,
    addSymbolsToGroup,
} from '@/lib/actions/watchlist-groups.actions';
import { MAX_GROUPS, type WatchlistGroup } from '@/lib/watchlist-groups';
import { cn } from '@/lib/utils';

/**
 * Tab bar for the up-to-5 watchlist groups: switch between lists, create /
 * rename / delete, and add a symbol straight into the active list.
 */
export default function WatchlistGroupBar({
    groups,
    activeId,
}: {
    groups: WatchlistGroup[];
    activeId: number;
}) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [editName, setEditName] = useState('');
    const [symbol, setSymbol] = useState('');

    const active = groups.find((g) => g.id === activeId) ?? groups[0];
    const atMax = groups.length >= MAX_GROUPS;

    const go = (id: number) => router.push(`/watchlist?list=${id}`);

    const doCreate = () =>
        start(async () => {
            const res = await createGroup(newName);
            if (!res.ok) { toast.error(res.error ?? 'Could not create'); return; }
            setCreating(false);
            setNewName('');
            toast.success('Watchlist created');
            if (res.id) router.push(`/watchlist?list=${res.id}`);
            else router.refresh();
        });

    const doRename = () =>
        start(async () => {
            const res = await renameGroup(active.id, editName);
            if (!res.ok) { toast.error(res.error ?? 'Could not rename'); return; }
            setRenaming(false);
            toast.success('Renamed');
            router.refresh();
        });

    const doDelete = () =>
        start(async () => {
            const res = await deleteGroup(active.id);
            if (!res.ok) { toast.error(res.error ?? 'Could not delete'); return; }
            toast.success('Watchlist deleted');
            const next = groups.find((g) => g.id !== active.id);
            if (next) router.push(`/watchlist?list=${next.id}`);
            else router.refresh();
        });

    const doAdd = () =>
        start(async () => {
            if (!symbol.trim()) return;
            const res = await addSymbolsToGroup(active.id, symbol);
            if (!res.ok) { toast.error(res.error ?? 'Could not add'); return; }
            setSymbol('');
            const skip = res.skipped > 0 ? ` · ${res.skipped} skipped` : '';
            toast.success(
                `${res.added} ${res.added === 1 ? 'ticker' : 'tickers'} added to ${active.name}${skip}`
            );
            router.refresh();
        });

    return (
        <div className="flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-800 pb-px">
                {groups.map((g) => (
                    <button
                        key={g.id}
                        type="button"
                        onClick={() => go(g.id)}
                        className={cn(
                            'rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
                            g.id === active.id
                                ? 'border-teal-400 text-teal-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        )}
                    >
                        {g.name}
                    </button>
                ))}

                {creating ? (
                    <span className="flex items-center gap-1 py-1">
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && doCreate()}
                            placeholder="List name"
                            maxLength={40}
                            className="w-32 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none"
                        />
                        <button type="button" onClick={doCreate} disabled={pending} className="rounded p-1 text-teal-400 hover:bg-gray-800" aria-label="Create">
                            {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        </button>
                        <button type="button" onClick={() => { setCreating(false); setNewName(''); }} className="rounded p-1 text-gray-500 hover:bg-gray-800" aria-label="Cancel">
                            <X size={15} />
                        </button>
                    </span>
                ) : (
                    !atMax && (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-teal-300"
                        >
                            <Plus size={15} /> New list
                        </button>
                    )
                )}
            </div>

            {/* Active-group controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {renaming ? (
                        <span className="flex items-center gap-1">
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && doRename()}
                                maxLength={40}
                                className="w-40 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none"
                            />
                            <button type="button" onClick={doRename} disabled={pending} className="rounded p-1 text-teal-400 hover:bg-gray-800" aria-label="Save name">
                                {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button type="button" onClick={() => setRenaming(false)} className="rounded p-1 text-gray-500 hover:bg-gray-800" aria-label="Cancel">
                                <X size={15} />
                            </button>
                        </span>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => { setEditName(active.name); setRenaming(true); }}
                                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
                            >
                                <Pencil size={12} /> Rename
                            </button>
                            {groups.length > 1 && (
                                <button
                                    type="button"
                                    onClick={doDelete}
                                    disabled={pending}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-red-400"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Add a symbol to this list */}
                <span className="flex items-center gap-1.5">
                    <input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && doAdd()}
                        placeholder="Add tickers — e.g. NVDA, AAPL, MSFT"
                        maxLength={160}
                        className="w-56 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-400/60 focus:outline-none sm:w-72"
                    />
                    <button
                        type="button"
                        onClick={doAdd}
                        disabled={pending || !symbol.trim()}
                        className="flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-semibold text-teal-400 transition-colors hover:bg-gray-700 disabled:opacity-40"
                    >
                        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                    </button>
                </span>
            </div>
        </div>
    );
}

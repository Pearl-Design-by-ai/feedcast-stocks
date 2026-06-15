'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Pencil, Trash2, Check, X, Loader2, List, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
    createGroup,
    renameGroup,
    deleteGroup,
    addSymbolsToGroup,
    removeSymbolsFromGroup,
} from '@/lib/actions/watchlist-groups.actions';
import { MAX_GROUPS, type WatchlistGroup, type GroupPortfolio } from '@/lib/watchlist-groups';
import { cn } from '@/lib/utils';

/** Each list's portfolio day move, shown on its tab. Treats the list as one
 *  share of every holding (value-weighted by price). Dash when no quote yet. */
function PortfolioBadge({ p }: { p?: GroupPortfolio }) {
    if (!p || p.count === 0 || p.changePct == null) return null;
    const v = p.changePct;
    const cls = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400';
    return (
        <span className={cn('tabular-nums text-xs font-semibold', cls)}>
            {v > 0 ? '+' : ''}{v.toFixed(2)}%
        </span>
    );
}

/**
 * Toolbar for the up-to-5 watchlist groups: switch between lists with pill
 * tabs, create / rename / delete the active list, and batch-add tickers
 * straight into it. Laid out as two stacked rows so nothing overflows on
 * narrow viewports — tabs on top, the active-list action bar below.
 */
export default function WatchlistGroupBar({
    groups,
    activeId,
    portfolios,
}: {
    groups: WatchlistGroup[];
    activeId: number;
    /** Per-group portfolio day move, keyed by group id. */
    portfolios?: Record<number, GroupPortfolio>;
}) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [navPending, startNav] = useTransition();
    const [targetId, setTargetId] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [editing, setEditing] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [editName, setEditName] = useState('');
    const [symbol, setSymbol] = useState('');

    const active = groups.find((g) => g.id === activeId) ?? groups[0];
    const atMax = groups.length >= MAX_GROUPS;

    // Optimistic selection: reflect the clicked tab the instant it's pressed,
    // while the server round-trip for that list is still in flight. Without
    // this the switch looks stuck — the new tab only gets a focus ring while
    // the old one keeps the active styling until the page re-renders.
    const shownId = navPending && targetId != null ? targetId : active.id;
    const shown = groups.find((g) => g.id === shownId) ?? active;

    const go = (id: number) => {
        if (id === shownId) return;
        setTargetId(id);
        startNav(() => {
            router.push(`/watchlist?list=${id}`);
        });
    };

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
            const res = await renameGroup(shown.id, editName);
            if (!res.ok) { toast.error(res.error ?? 'Could not rename'); return; }
            setRenaming(false);
            setEditing(false);
            toast.success('Renamed');
            router.refresh();
        });

    const doDelete = () =>
        start(async () => {
            const res = await deleteGroup(shown.id);
            if (!res.ok) { toast.error(res.error ?? 'Could not delete'); return; }
            setEditing(false);
            toast.success('Watchlist deleted');
            const next = groups.find((g) => g.id !== shown.id);
            if (next) router.push(`/watchlist?list=${next.id}`);
            else router.refresh();
        });

    const doAdd = () =>
        start(async () => {
            if (!symbol.trim()) return;
            const res = await addSymbolsToGroup(shown.id, symbol);
            if (!res.ok) { toast.error(res.error ?? 'Could not add'); return; }
            setSymbol('');
            const skip = res.skipped > 0 ? ` · ${res.skipped} skipped` : '';
            toast.success(
                `${res.added} ${res.added === 1 ? 'ticker' : 'tickers'} added to ${shown.name}${skip}`
            );
            router.refresh();
        });

    const doRemove = () =>
        start(async () => {
            if (!symbol.trim()) return;
            const res = await removeSymbolsFromGroup(shown.id, symbol);
            if (!res.ok) { toast.error(res.error ?? 'Could not remove'); return; }
            setSymbol('');
            if (res.removed === 0) { toast.info('No matching tickers in this list'); return; }
            toast.success(
                `${res.removed} ${res.removed === 1 ? 'ticker' : 'tickers'} removed from ${shown.name}`
            );
            router.refresh();
        });

    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-1.5 shadow-sm">
            {/* Row 1 — list tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1">
                <List size={15} className="mx-1.5 shrink-0 text-gray-600" />
                {groups.map((g) => {
                    const isActive = g.id === shownId;
                    const isLoading = navPending && targetId === g.id;
                    return (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => go(g.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-400/40'
                                    : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-100'
                            )}
                        >
                            {g.name}
                            <PortfolioBadge p={portfolios?.[g.id]} />
                            {isLoading && <Loader2 size={13} className="animate-spin" />}
                        </button>
                    );
                })}

                {creating ? (
                    <span className="flex items-center gap-1 pl-1">
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') doCreate();
                                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                            }}
                            placeholder="List name"
                            maxLength={40}
                            className="w-36 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none"
                        />
                        <button type="button" onClick={doCreate} disabled={pending} className="rounded-lg p-1.5 text-teal-400 hover:bg-gray-800" aria-label="Create list">
                            {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button type="button" onClick={() => { setCreating(false); setNewName(''); }} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800" aria-label="Cancel">
                            <X size={16} />
                        </button>
                    </span>
                ) : (
                    !atMax && (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-800/70 hover:text-teal-300"
                        >
                            <Plus size={15} /> New list
                        </button>
                    )
                )}
            </div>

            {/* Row 2 — active-list action bar */}
            <div className="mt-1 flex flex-col gap-2 rounded-xl border border-gray-800/80 bg-gray-950/40 p-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Rename / delete the active list */}
                <div className="flex items-center gap-1.5">
                    {renaming ? (
                        <span className="flex items-center gap-1">
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') doRename();
                                    if (e.key === 'Escape') setRenaming(false);
                                }}
                                maxLength={40}
                                className="w-44 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-teal-400/60 focus:outline-none"
                            />
                            <button type="button" onClick={doRename} disabled={pending} className="rounded-lg p-1.5 text-teal-400 hover:bg-gray-800" aria-label="Save name">
                                {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button type="button" onClick={() => setRenaming(false)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800" aria-label="Cancel">
                                <X size={16} />
                            </button>
                        </span>
                    ) : editing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => { setEditName(shown.name); setRenaming(true); }}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100"
                            >
                                <Pencil size={13} /> Rename
                            </button>
                            {groups.length > 1 && (
                                <button
                                    type="button"
                                    onClick={doDelete}
                                    disabled={pending}
                                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
                                aria-label="Done editing"
                            >
                                <X size={15} />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-200"
                        >
                            <MoreHorizontal size={14} /> Edit
                        </button>
                    )}
                </div>

                {/* Batch add / remove tickers on the active list */}
                <div className="flex items-center gap-1.5">
                    <input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && doAdd()}
                        placeholder="Tickers — e.g. NVDA, AAPL, MSFT"
                        maxLength={160}
                        className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-400/60 focus:outline-none sm:w-64 sm:flex-none"
                    />
                    <button
                        type="button"
                        onClick={doAdd}
                        disabled={pending || !symbol.trim()}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-500/15 px-3 py-1.5 text-sm font-semibold text-teal-300 ring-1 ring-inset ring-teal-400/30 transition-colors hover:bg-teal-500/25 disabled:opacity-40"
                    >
                        {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add
                    </button>
                    <button
                        type="button"
                        onClick={doRemove}
                        disabled={pending || !symbol.trim()}
                        title="Remove these tickers from this list"
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-300 ring-1 ring-inset ring-red-400/30 transition-colors hover:bg-red-500/20 disabled:opacity-40"
                    >
                        <Minus size={15} /> Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
    addSymbolToGroup,
    removeSymbolFromGroup,
} from "@/lib/actions/watchlist-groups.actions";
import type { WatchlistGroup } from "@/lib/watchlist-groups";

interface WatchlistStarProps {
    symbol: string;
    initialGroups: WatchlistGroup[];
    initialMemberOf: number[];
    signedIn: boolean;
}

/**
 * Minimalist per-list watchlist star for a stock page. The star is filled once
 * the symbol is in at least one list. Tapping it opens a small popover of the
 * member's watchlists, each with a check showing membership — toggling a row
 * adds the symbol to *that* specific list or removes it from it. Because every
 * list is shown individually, "which list do I take it out of?" is answered by
 * the user directly rather than guessed.
 */
export default function WatchlistStar({
    symbol,
    initialGroups,
    initialMemberOf,
    signedIn,
}: WatchlistStarProps) {
    const [open, setOpen] = useState(false);
    const [memberOf, setMemberOf] = useState<Set<number>>(new Set(initialMemberOf));
    const [pending, setPending] = useState<Set<number>>(new Set());
    const ref = useRef<HTMLDivElement>(null);

    const inAny = memberOf.size > 0;

    // Close the popover on an outside click or Escape.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const handleStarClick = () => {
        if (!signedIn) {
            toast.error("Sign in to use watchlists");
            return;
        }
        setOpen((o) => !o);
    };

    const toggleGroup = async (group: WatchlistGroup) => {
        if (pending.has(group.id)) return;
        const wasMember = memberOf.has(group.id);

        // Optimistic update.
        setMemberOf((prev) => {
            const next = new Set(prev);
            if (wasMember) next.delete(group.id);
            else next.add(group.id);
            return next;
        });
        setPending((prev) => new Set(prev).add(group.id));

        try {
            const res = wasMember
                ? await removeSymbolFromGroup(group.id, symbol)
                : await addSymbolToGroup(group.id, symbol);
            if (!res.ok) throw new Error((res as { error?: string }).error || "Failed");
            toast.success(
                wasMember
                    ? `${symbol} removed from ${group.name}`
                    : `${symbol} added to ${group.name}`
            );
        } catch (err) {
            // Revert on failure.
            setMemberOf((prev) => {
                const next = new Set(prev);
                if (wasMember) next.add(group.id);
                else next.delete(group.id);
                return next;
            });
            toast.error(err instanceof Error && err.message ? err.message : "Could not update watchlist");
        } finally {
            setPending((prev) => {
                const next = new Set(prev);
                next.delete(group.id);
                return next;
            });
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={handleStarClick}
                aria-label={inAny ? `Edit watchlists for ${symbol}` : `Add ${symbol} to a watchlist`}
                aria-expanded={open}
                title={inAny ? "In your watchlist" : "Add to watchlist"}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    inAny
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                        : "border-white/15 text-gray-300 hover:border-white/30 hover:text-white"
                }`}
            >
                <Star className="h-4 w-4" fill={inAny ? "currentColor" : "none"} strokeWidth={1.75} />
                <span className="hidden sm:inline">{inAny ? "Watching" : "Watchlist"}</span>
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 shadow-xl backdrop-blur"
                >
                    <div className="border-b border-white/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Add to watchlist
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {initialGroups.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-gray-500">No watchlists yet.</div>
                        ) : (
                            initialGroups.map((group) => {
                                const isMember = memberOf.has(group.id);
                                const isPending = pending.has(group.id);
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        role="menuitemcheckbox"
                                        aria-checked={isMember}
                                        onClick={() => toggleGroup(group)}
                                        disabled={isPending}
                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-white/5 disabled:opacity-60"
                                    >
                                        <span className="truncate">{group.name}</span>
                                        <span className="flex h-5 w-5 flex-none items-center justify-center">
                                            {isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            ) : isMember ? (
                                                <Check className="h-4 w-4 text-yellow-400" />
                                            ) : (
                                                <Plus className="h-4 w-4 text-gray-500" />
                                            )}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <Link
                        href="/watchlist"
                        className="block border-t border-white/10 px-3 py-2 text-xs text-teal-400 transition-colors hover:bg-white/5 hover:text-teal-300"
                    >
                        Manage lists →
                    </Link>
                </div>
            )}
        </div>
    );
}

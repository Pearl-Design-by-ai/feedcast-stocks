'use client';

import Link from 'next/link';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, X } from 'lucide-react';
import TradingViewWidget from '@/components/TradingViewWidget';
import { MINI_SYMBOL_WIDGET_CONFIG } from '@/lib/constants';
import { formatSymbolForTradingView } from '@/lib/utils';
import type { PeriodReturns } from '@/lib/returns-math';

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

const COLS: Array<{ key: keyof PeriodReturns; label: string }> = [
    { key: 'w1', label: '1W' },
    { key: 'm1', label: '1M' },
    { key: 'm3', label: '3M' },
    { key: 'ytd', label: 'YTD' },
    { key: 'y1', label: '1Y' },
];

export interface PeekTarget {
    symbol: string;
    name: string;
    returns: PeriodReturns;
}

/**
 * Context-preserving quick look at a symbol: a sheet anchored over the current
 * list (bottom on mobile, right on desktop) with a 12M mini chart, the row's
 * returns and a link into the full analysis page. Closing returns the user to
 * the exact list state — no navigation, no scroll reset.
 */
export default function SymbolPeekSheet({
    peek,
    onClose,
}: {
    peek: PeekTarget | null;
    onClose: () => void;
}) {
    return (
        <DialogPrimitive.Root open={!!peek} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
                <DialogPrimitive.Content
                    className="fixed z-50 flex flex-col gap-4 border-gray-800 bg-gray-950 p-4 shadow-2xl duration-200 ease-out focus:outline-none
                        inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t
                        data-[state=open]:animate-in data-[state=closed]:animate-out
                        data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom
                        sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0
                        sm:data-[state=open]:slide-in-from-right sm:data-[state=closed]:slide-out-to-right"
                >
                    {peek && (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <DialogPrimitive.Title className="text-xl font-bold text-gray-100 tabular-nums">
                                        {peek.symbol}
                                    </DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="truncate text-sm text-gray-400">
                                        {peek.name}
                                    </DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close
                                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </DialogPrimitive.Close>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40">
                                <TradingViewWidget
                                    key={peek.symbol}
                                    scriptUrl={`${SCRIPT}mini-symbol-overview.js`}
                                    config={MINI_SYMBOL_WIDGET_CONFIG(formatSymbolForTradingView(peek.symbol))}
                                    height={180}
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-1 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                                {COLS.map((c) => {
                                    const v = peek.returns[c.key];
                                    return (
                                        <div key={c.key} className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                {c.label}
                                            </span>
                                            <span
                                                className={`text-sm font-semibold tabular-nums ${
                                                    v == null ? 'text-gray-600' : v >= 0 ? 'text-green-500' : 'text-red-500'
                                                }`}
                                            >
                                                {v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Link
                                href={`/stocks/${peek.symbol}`}
                                className="group flex items-center justify-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-[background-color,border-color,transform] duration-150 ease-out hover:border-gray-700 hover:bg-gray-900/70 active:scale-[0.98]"
                            >
                                Open full analysis
                                <ArrowRight size={15} className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                            </Link>
                            <p className="text-center text-[11px] text-gray-600 sm:text-left">
                                Esc or tap outside to return to the list exactly where you left it.
                            </p>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

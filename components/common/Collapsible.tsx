'use client';

/**
 * A simple collapsible section: a clickable header row with a chevron that
 * shows/hides its body. Used to declutter pages with several optional panels
 * (e.g. the Portfolio Labs "seed your basket" sections) so the page opens clean
 * and the user expands only what they need.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Collapsible({
    header,
    children,
    defaultOpen = false,
    className,
}: {
    /** Header content (icon + title + chips) — the whole row is the toggle. */
    header: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    /** Wrapper classes (border/background) so callers keep their accent. */
    className?: string;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section className={cn('overflow-hidden', className)}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 p-4 text-left md:p-5"
            >
                <div className="min-w-0">{header}</div>
                <ChevronDown
                    size={18}
                    className={cn('shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
                />
            </button>
            {open && (
                <div className="px-4 pb-4 md:px-5 md:pb-5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    {children}
                </div>
            )}
        </section>
    );
}

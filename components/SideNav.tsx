'use client';

/**
 * Desktop-permanent left rail mirroring the main Feedcast app's SideNav so
 * Feedcast Markets reads as the same product: a frosted glass card that
 * collapses to a 52-px icon rail and expands to a 260-px labelled panel.
 * Open state is persisted to localStorage so the choice survives reloads.
 *
 * Below md it renders nothing — the Header's hamburger (MobileNav) drives
 * narrow viewports, matching Feedcast's mobile drawer pattern.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Menu,
    PanelLeftClose,
    ArrowLeft,
    LayoutDashboard,
    Star,
    Activity,
    Coins,
    Globe,
    Landmark,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARKETS_NAV } from '@/lib/constants';

const STORAGE_KEY = 'feedcast_markets_sidenav_open';

type RailItem = { href: string; label: string; Icon: LucideIcon };

const PRIMARY_ITEMS: RailItem[] = [
    { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/watchlist', label: 'Watchlist', Icon: Star },
];

// Icons for the "Markets" group, keyed by the hrefs in lib/constants.
const MARKET_ICONS: Record<string, LucideIcon> = {
    '/market-indicators': Activity,
    '/currency': Coins,
    '/world-indices': Globe,
    '/fixed-income': Landmark,
};

export default function SideNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            if (localStorage.getItem(STORAGE_KEY) === 'true') setOpen(true);
        } catch {
            /* localStorage unavailable — stay collapsed */
        }
    }, []);

    const toggle = () => {
        setOpen((v) => {
            const next = !v;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    const compact = !open;
    const labelClass = compact ? 'sr-only' : '';

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    const rowClass = (active: boolean) =>
        cn(
            compact
                ? 'flex items-center justify-center w-10 h-10 my-0.5 mx-auto rounded-md transition-colors'
                : 'flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors',
            active
                ? 'text-gray-100 bg-gray-700'
                : 'text-gray-400 hover:text-teal-400 hover:bg-gray-700',
        );

    const dividerClass = compact
        ? 'my-2 mx-2 h-px bg-gray-600'
        : 'px-4 pt-4 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider';

    return (
        <aside
            className={cn(
                'hidden md:block shrink-0 transition-[width] duration-200',
                compact ? 'w-[52px]' : 'w-[260px]',
            )}
            aria-label="Primary navigation"
        >
            {/* Glass rail — same frosted-card language as Feedcast's rail. */}
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pb-4 scrollbar-hide rounded-xl border border-gray-600 bg-gray-800 ring-1 ring-gray-600/50">
                {/* Accent hairline */}
                <div className="h-[2px] bg-gradient-to-r from-teal-400/0 via-teal-400/70 to-teal-400/0" />

                {/* Toggle row — fixed x-position in both modes */}
                <div className="group/toggle relative">
                    <button
                        type="button"
                        onClick={toggle}
                        aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
                        aria-expanded={open}
                        className={cn(
                            'flex items-center w-full text-gray-500 hover:text-gray-100 hover:bg-gray-700 transition-colors',
                            compact
                                ? 'justify-center h-10 my-1 mx-auto w-10 rounded-md'
                                : 'gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider',
                        )}
                    >
                        {compact ? (
                            <Menu size={18} />
                        ) : (
                            <>
                                <PanelLeftClose size={14} />
                                <span>Hide menu</span>
                            </>
                        )}
                    </button>

                    {compact && (
                        <div
                            role="tooltip"
                            className="pointer-events-none absolute left-full top-1/2 ml-3 w-56 -translate-y-1/2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-100 shadow-xl opacity-0 transition-opacity duration-150 group-hover/toggle:opacity-100 z-50"
                        >
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Browse menu
                            </p>
                            <p className="leading-relaxed">
                                Dashboard · Watchlist · Indicators · Currency · World Indices · Fixed Income
                            </p>
                        </div>
                    )}
                </div>

                <nav className="px-1.5">
                    {/* Return to the parent Feedcast app */}
                    <a
                        href="https://www.feedcast.news"
                        title="Back to Feedcast"
                        className={cn(
                            compact
                                ? 'flex items-center justify-center w-10 h-10 my-0.5 mx-auto rounded-md transition-colors'
                                : 'flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors',
                            'text-gray-500 hover:text-teal-400 hover:bg-gray-700',
                        )}
                    >
                        <ArrowLeft size={18} className="shrink-0" />
                        <span className={labelClass}>Back to Feedcast</span>
                    </a>

                    <div className={dividerClass}>{compact ? null : 'Browse'}</div>

                    {PRIMARY_ITEMS.map(({ href, label, Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={rowClass(isActive(href))}
                            title={compact ? label : undefined}
                        >
                            <Icon size={18} className="shrink-0" />
                            <span className={labelClass}>{label}</span>
                        </Link>
                    ))}

                    <div className={dividerClass}>{compact ? null : MARKETS_NAV.label}</div>

                    {MARKETS_NAV.items.map(({ href, label }) => {
                        const Icon = MARKET_ICONS[href] ?? Activity;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={rowClass(isActive(href))}
                                title={compact ? label : undefined}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span className={labelClass}>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

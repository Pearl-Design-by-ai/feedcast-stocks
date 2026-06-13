'use client';

/**
 * Mobile navigation drawer — mirrors the main feedcast.news app: tapping the
 * logo in the header slides a full-height panel in from the left while the
 * page stays dimmed behind it. Content is grouped like the main app's menu
 * (profile block → core pages → collapsible Markets → personalize → about),
 * with sign-out anchored at the bottom.
 *
 * Renders only below md — md+ uses the persistent SideNav rail.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronDown,
  LayoutDashboard,
  Search,
  Star,
  Radar,
  GraduationCap,
  Activity,
  Palette,
  Info,
  LifeBuoy,
  Code,
  ArrowLeft,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { FeedcastLogo } from '@/components/FeedcastLogo';
import SearchCommand from '@/components/SearchCommand';
import { MARKETS_NAV } from '@/lib/constants';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const FEEDCAST_HOME = 'https://www.feedcast.news/';

const ROW =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-gray-200 transition-colors hover:bg-gray-700/70 hover:text-teal-400';

function openSearch() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
  );
}

export default function MobileDrawer({
  user,
  initialStocks,
}: {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onMarketPage = MARKETS_NAV.items.some((item) => pathname.startsWith(item.href));
  const [marketsOpen, setMarketsOpen] = useState(onMarketPage);

  // Close on navigation and lock body scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.href = FEEDCAST_HOME;
  };

  const item = (href: string, label: string, Icon: LucideIcon, accent = false) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={close}
        className={cn(ROW, accent && 'text-teal-400', active && 'bg-gray-700/60 text-teal-400')}
      >
        <Icon size={18} className="shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Trigger: the logo itself opens the menu (like the main app). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex items-center gap-2"
      >
        <FeedcastLogo size={34} className="text-teal-400" />
        <span className="text-xl font-semibold text-gray-100">
          FeedCast <span className="text-teal-400">Markets</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Dimmed page behind — tap to close. */}
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-150"
            onClick={close}
            aria-hidden
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto border-r border-gray-700 bg-gray-800 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Profile block */}
            <div className="flex items-start justify-between gap-2 px-4 pb-4 pt-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-base font-bold text-teal-400">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-100">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700/70 hover:text-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col px-3 pb-6">
              {/* Core */}
              {item('/', 'Dashboard', LayoutDashboard)}
              <button type="button" onClick={() => { close(); openSearch(); }} className={ROW}>
                <Search size={18} className="shrink-0" />
                Search
              </button>
              {item('/watchlist', 'Watchlist', Star)}
              {item('/bubble-detector', 'Bubble Detector', Radar)}
              {item('/learn', 'Learn', GraduationCap)}

              <div className="my-3 h-px bg-gray-700/70" />

              {/* Markets — collapsible group */}
              <button
                type="button"
                onClick={() => setMarketsOpen((v) => !v)}
                aria-expanded={marketsOpen}
                className={cn(ROW, 'justify-between')}
              >
                <span className="flex items-center gap-3">
                  <Activity size={18} className="shrink-0" />
                  Markets
                </span>
                <ChevronDown
                  size={16}
                  className={cn('text-gray-500 transition-transform duration-200', marketsOpen && 'rotate-180')}
                />
              </button>
              {marketsOpen && (
                <div className="flex flex-col animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  {MARKETS_NAV.items.map(({ href, label }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={close}
                        className={cn(
                          'rounded-lg py-2 pl-12 pr-3 text-[14px] text-gray-300 transition-colors hover:bg-gray-700/70 hover:text-teal-400',
                          active && 'text-teal-400'
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="my-3 h-px bg-gray-700/70" />

              {/* Personalize */}
              {item('/appearance', 'Appearance', Palette, true)}

              <div className="my-3 h-px bg-gray-700/70" />

              {/* About */}
              {item('/about', 'About', Info)}
              {item('/help', 'Help', LifeBuoy)}
              {item('/api-docs', 'API Docs', Code)}

              {/* Bottom: back + sign out */}
              <div className="mt-auto pt-6">
                <div className="mb-3 h-px bg-gray-700/70" />
                <a href={FEEDCAST_HOME} className={cn(ROW, 'text-gray-400')}>
                  <ArrowLeft size={18} className="shrink-0" />
                  Back to Feedcast
                </a>
                <button type="button" onClick={handleSignOut} className={ROW}>
                  <LogOut size={18} className="shrink-0" />
                  Log out
                </button>
              </div>
            </nav>
          </div>

        </div>
      )}

      {/* Hidden SearchCommand mounts the global Cmd/Ctrl+K listener so the
          Search row works on mobile, where the SideNav (which usually hosts
          it) doesn't render. The dialog itself is portal-rendered. */}
      <div className="hidden">
        <SearchCommand renderAs="text" label="Search" initialStocks={initialStocks} />
      </div>
    </>
  );
}

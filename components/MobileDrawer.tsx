'use client';

/**
 * Mobile navigation drawer — tapping the logo slides a full-height panel in
 * from the left over the dimmed page. The menu mirrors the desktop SideNav:
 * everything is grouped into collapsible category accordions (Home / My Lists
 * / Research / Markets / More), each remembering its open state (shared with
 * the rail via the same localStorage keys) and auto-opening the section that
 * holds the active route. Sign-out is anchored at the bottom.
 *
 * Renders only below md — md+ uses the persistent SideNav rail.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ArrowLeft, LogOut } from 'lucide-react';
import { FeedcastLogo } from '@/components/FeedcastLogo';
import SearchCommand from '@/components/SearchCommand';
import { navSectionsForUser, NAV_DEFAULT_OPEN, SEARCH_HREF, SIGN_IN_URL, FEEDCAST_HOME } from '@/lib/constants';
import { NAV_ICONS, SECTION_ICONS, NAV_FALLBACK_ICON } from '@/components/navIcons';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const SECTION_KEY = (id: string) => `fcm_nav_sec_${id}`;

const ROW =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-gray-200 transition-colors hover:bg-gray-700/70 hover:text-teal-400';
const SUBROW =
  'flex w-full items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-[14px] text-gray-300 transition-colors hover:bg-gray-700/70 hover:text-teal-400';

function openSearch() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
  );
}

export default function MobileDrawer({
  user,
  initialStocks,
  isPowerUser = false,
}: {
  user: User | null;
  initialStocks: StockWithWatchlistStatus[];
  isPowerUser?: boolean;
}) {
  const pathname = usePathname();
  const navSections = navSectionsForUser(isPowerUser);
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of navSections) init[s.id] = NAV_DEFAULT_OPEN.includes(s.id);
    return init;
  });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

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

  // Apply saved open state + reveal the active section.
  useEffect(() => {
    setSections((prev) => {
      const next = { ...prev };
      for (const s of navSections) {
        let v = NAV_DEFAULT_OPEN.includes(s.id);
        try {
          const stored = localStorage.getItem(SECTION_KEY(s.id));
          if (stored != null) v = stored === 'true';
        } catch {
          /* ignore */
        }
        if (s.items.some((it) => isActive(it.href))) v = true;
        next[s.id] = v;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const close = () => setOpen(false);

  const toggleSection = (id: string) => {
    setSections((prev) => {
      const next = !prev[id];
      try {
        localStorage.setItem(SECTION_KEY(id), String(next));
      } catch {
        /* ignore */
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSignOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.href = FEEDCAST_HOME;
  };

  const renderItem = (href: string, label: string) => {
    const Icon = NAV_ICONS[href] ?? NAV_FALLBACK_ICON;
    const active = isActive(href);
    const accent = href === '/appearance';

    if (href === SEARCH_HREF) {
      return (
        <button key={href} type="button" onClick={() => { close(); openSearch(); }} className={SUBROW}>
          <Icon size={16} className="shrink-0" />
          {label}
        </button>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        onClick={close}
        className={cn(SUBROW, accent && 'text-teal-400', active && 'bg-gray-700/50 text-teal-400')}
      >
        <Icon size={16} className="shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Trigger: a hamburger icon on the left, alongside the logo, opens the menu. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex items-center gap-2"
      >
        <Menu size={26} className="shrink-0 text-gray-100" />
        <FeedcastLogo size={34} className="text-teal-400" />
        <span className="text-xl font-semibold text-gray-100">
          FeedCast <span className="text-teal-400">Markets</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-150"
            onClick={close}
            aria-hidden
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto border-r border-gray-700 bg-gray-800 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Profile block */}
            <div className="flex items-start justify-between gap-2 px-4 pb-4 pt-5">
              {user ? (
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-base font-bold text-teal-400">
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-100">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ) : (
                <a
                  href={SIGN_IN_URL}
                  className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-teal-950 transition-colors hover:bg-teal-400"
                >
                  Sign in
                </a>
              )}
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
              {navSections.map((section) => {
                const SecIcon = SECTION_ICONS[section.id] ?? NAV_FALLBACK_ICON;
                const sectionOpen = sections[section.id];
                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={sectionOpen}
                      className={cn(ROW, 'justify-between text-gray-300')}
                    >
                      <span className="flex items-center gap-3">
                        <SecIcon size={18} className="shrink-0" />
                        {section.label}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn('text-gray-500 transition-transform duration-200', sectionOpen && 'rotate-180')}
                      />
                    </button>
                    {sectionOpen && (
                      <div className="mb-1 flex flex-col animate-in fade-in-0 slide-in-from-top-1 duration-150">
                        {section.items.map((it) => renderItem(it.href, it.label))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom: back + sign out */}
              <div className="mt-auto pt-6">
                <div className="mb-3 h-px bg-gray-700/70" />
                <a href={FEEDCAST_HOME} className={cn(ROW, 'text-gray-400')}>
                  <ArrowLeft size={18} className="shrink-0" />
                  Back to Feedcast
                </a>
                {user && (
                  <button type="button" onClick={handleSignOut} className={ROW}>
                    <LogOut size={18} className="shrink-0" />
                    Log out
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hidden SearchCommand mounts the global Cmd/Ctrl+K listener for mobile. */}
      <div className="hidden">
        <SearchCommand renderAs="text" label="Search" initialStocks={initialStocks} />
      </div>
    </>
  );
}

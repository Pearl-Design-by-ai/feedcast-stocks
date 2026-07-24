'use client';

/**
 * Desktop-permanent left sidebar for FeedCast Markets. A frosted-glass rail
 * with a hamburger that collapses the 260px panel into a 52px icon rail
 * (state persisted to localStorage). When expanded, the menu is organized into
 * collapsible category accordions (Home / My Lists / Research / Markets /
 * More) — each section remembers its open state, and the section holding the
 * active route auto-opens. When collapsed to the icon rail, every item shows
 * as a flat icon (accordions don't apply without labels).
 *
 * Below md the rail doesn't render — the Header's MobileDrawer handles narrow
 * viewports. Brand color: rows use `text-teal-400`, mapped to the member's
 * accent via the `--brand` var set in the (root) layout.
 */

import { useEffect, useState, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, PanelLeftClose, ArrowLeft, ChevronDown } from 'lucide-react';
import SearchCommand from '@/components/SearchCommand';
import { navSectionsForUser, NAV_DEFAULT_OPEN, SEARCH_HREF, FEEDCAST_HOME } from '@/lib/constants';
import { NAV_ICONS, SECTION_ICONS, NAV_FALLBACK_ICON } from '@/components/navIcons';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'fcm_sidenav_open';
const SECTION_KEY = (id: string) => `fcm_nav_sec_${id}`;

/** Open the SearchCommand dialog via its global Cmd/Ctrl+K listener. */
function openSearch() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }),
  );
}

export function SideNav({ initialStocks, isPowerUser = false }: { initialStocks: StockWithWatchlistStatus[]; isPowerUser?: boolean }) {
  const pathname = usePathname();
  const navSections = navSectionsForUser(isPowerUser);

  // Rail open vs. collapsed-to-icons. SSR + first paint render open (no
  // hydration mismatch); the effect collapses it for members who hid it.
  const [open, setOpen] = useState(true);

  // Per-section accordion state — deterministic default so SSR matches the
  // first client render; localStorage + active-route auto-open applied after.
  const [sections, setSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of navSections) init[s.id] = NAV_DEFAULT_OPEN.includes(s.id);
    return init;
  });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'false') setOpen(false);
    } catch {
      /* localStorage blocked — stay open */
    }
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
        // Always reveal the section that contains the current page.
        if (s.items.some((it) => isActive(it.href))) v = true;
        next[s.id] = v;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleRail = () => {
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

  const compact = !open;

  const rowClass = (active: boolean) =>
    cn(
      'transition-colors',
      compact
        ? 'flex items-center justify-center h-10 w-10 mx-auto my-0.5 rounded-md'
        : 'flex items-center gap-3 rounded-md px-4 py-2 text-[14px]',
      active
        ? 'bg-gray-700/60 text-teal-400'
        : 'text-gray-300 hover:bg-gray-700/70 hover:text-teal-400',
    );

  const renderItem = (href: string, label: string) => {
    const Icon = NAV_ICONS[href] ?? NAV_FALLBACK_ICON;
    const active = isActive(href);
    const inner = (
      <>
        <Icon size={compact ? 18 : 16} className="shrink-0" />
        {!compact && <span className="truncate">{label}</span>}
      </>
    );

    if (href === SEARCH_HREF) {
      return (
        <button
          key={href}
          type="button"
          onClick={openSearch}
          title={compact ? label : undefined}
          aria-label={label}
          className={cn(rowClass(false), 'w-full text-left')}
        >
          {inner}
        </button>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        title={compact ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={rowClass(active)}
      >
        {inner}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'hidden md:block shrink-0 transition-[width] duration-200',
        compact ? 'w-[52px]' : 'w-[260px]',
      )}
      aria-label="Primary navigation"
    >
      {/* Hidden SearchCommand: mounts the global Cmd/Ctrl+K listener. */}
      <div className="hidden">
        <SearchCommand renderAs="text" label="Search" initialStocks={initialStocks} />
      </div>

      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pb-4 scrollbar-hide rounded-xl border border-gray-700 bg-gray-800 ring-1 ring-gray-700/50">
        {/* Accent hairline — tinted by the member's accent via --brand. */}
        <div className="h-[2px] bg-gradient-to-r from-teal-400/0 via-teal-400/70 to-teal-400/0" />

        {/* Hamburger / collapse toggle — anchored top so it never shifts. */}
        <button
          type="button"
          onClick={toggleRail}
          aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={open}
          className={cn(
            'flex items-center w-full text-gray-400 hover:text-gray-100 hover:bg-gray-700/70 transition-colors',
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

        <nav className="px-2">
          {/* Back to Feedcast */}
          <a
            href={FEEDCAST_HOME}
            title={compact ? 'Back to Feedcast' : undefined}
            className={rowClass(false)}
          >
            <ArrowLeft size={compact ? 18 : 16} className="shrink-0" />
            {!compact && <span className="truncate">Back to Feedcast</span>}
          </a>

          <div className="my-2 h-px bg-gray-700/70" />

          {compact
            ? // Icon rail: all items flat, divided by section.
              navSections.map((section, idx) => (
                <Fragment key={section.id}>
                  {idx > 0 && <div className="my-2 mx-auto h-px w-6 bg-gray-700" />}
                  {section.items.map((it) => renderItem(it.href, it.label))}
                </Fragment>
              ))
            : // Expanded: collapsible category accordions.
              navSections.map((section) => {
                const SecIcon = SECTION_ICONS[section.id] ?? NAV_FALLBACK_ICON;
                const sectionOpen = sections[section.id];
                return (
                  <div key={section.id} className="mt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={sectionOpen}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300"
                    >
                      <span className="flex items-center gap-2">
                        <SecIcon size={14} className="shrink-0" />
                        {section.label}
                      </span>
                      <ChevronDown
                        size={15}
                        className={cn('transition-transform duration-200', sectionOpen && 'rotate-180')}
                      />
                    </button>
                    {sectionOpen && (
                      <div className="mb-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                        {section.items.map((it) => renderItem(it.href, it.label))}
                      </div>
                    )}
                  </div>
                );
              })}
        </nav>
      </div>
    </aside>
  );
}

export default SideNav;

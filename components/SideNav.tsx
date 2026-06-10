'use client';

/**
 * Desktop-permanent left sidebar for FeedCast Markets — designed to match the
 * main Feedcast app's SideNav (frosted glass rail, accent hairline, a
 * hamburger toggle that collapses the 260px panel into a 52px icon rail).
 * Open state persists to localStorage so it survives reloads.
 *
 * Below md the rail doesn't render — the Header's MobileNav drawer handles
 * narrow viewports, exactly like the main site.
 *
 * Brand color: rows use `text-teal-400`, which globals.css maps to the runtime
 * `--brand` var. The (root) layout sets `--brand` per-member from their saved
 * accent color, so this rail is tinted with the same accent they chose on
 * www.feedcast.news.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  PanelLeftClose,
  ArrowLeft,
  LayoutDashboard,
  Search,
  Star,
  Briefcase,
  Sparkles,
  Activity,
  Gauge,
  LayoutGrid,
  Globe,
  Banknote,
  Wheat,
  Landmark,
  Bitcoin,
  CalendarClock,
  CalendarDays,
  Filter,
  Scale,
  FileText,
  Compass,
  Radar,
  Waves,
  HeartPulse,
  Palette,
  Info,
  LifeBuoy,
  Code,
  type LucideIcon,
} from 'lucide-react';
import SearchCommand from '@/components/SearchCommand';
import { NAV_ITEMS, MARKETS_NAV, REPORTS_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'fcm_sidenav_open';
const FEEDCAST_HOME = 'https://www.feedcast.news/';

type Item = { href: string; label: string; icon: LucideIcon; search?: boolean };

const MAIN_ICONS: Record<string, LucideIcon> = {
  '/': LayoutDashboard,
  '/search': Search,
  '/watchlist': Star,
  '/portfolio': Briefcase,
};

const MARKETS_ICONS: Record<string, LucideIcon> = {
  '/ask': Sparkles,
  '/market-regime': Activity,
  '/market-indicators': Gauge,
  '/sectors': LayoutGrid,
  '/world-indices': Globe,
  '/currency': Banknote,
  '/commodities': Wheat,
  '/fixed-income': Landmark,
  '/crypto': Bitcoin,
  '/economic-calendar': CalendarClock,
  '/calendar': CalendarDays,
  '/screener': Filter,
  '/compare': Scale,
};

const REPORTS_ICONS: Record<string, LucideIcon> = {
  '/reports': FileText,
  '/reports/macro-compass': Compass,
  '/reports/index-pulse': Radar,
  '/reports/vol-radar': Waves,
  '/reports/holdings-health': HeartPulse,
};

const MAIN_ITEMS: Item[] = NAV_ITEMS.map((i) => ({
  ...i,
  icon: MAIN_ICONS[i.href] ?? LayoutDashboard,
  search: i.href === '/search',
}));

const MARKETS_ITEMS: Item[] = MARKETS_NAV.items.map((i) => ({
  ...i,
  icon: MARKETS_ICONS[i.href] ?? Activity,
}));

const REPORTS_ITEMS: Item[] = REPORTS_NAV.items.map((i) => ({
  ...i,
  icon: REPORTS_ICONS[i.href] ?? FileText,
}));

const MORE_ITEMS: Item[] = [
  { href: '/appearance', label: 'Appearance', icon: Palette },
  { href: '/about', label: 'About', icon: Info },
  { href: '/help', label: 'Help', icon: LifeBuoy },
  { href: '/api-docs', label: 'API Docs', icon: Code },
];

/** Open the SearchCommand dialog via its global Cmd/Ctrl+K listener. */
function openSearch() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }),
  );
}

export function SideNav({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) {
  const pathname = usePathname();

  // SSR + first client paint both render collapsed → no hydration mismatch.
  // useEffect flips to open only for members who previously expanded it.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') setOpen(true);
    } catch {
      /* localStorage blocked — stay collapsed */
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

  // '/reports' is a hub with child pages of its own — exact match only, so the
  // hub row doesn't stay lit while reading an individual report.
  const isActive = (href: string) =>
    href === '/' || href === '/reports' ? pathname === href : pathname.startsWith(href);

  const rowClass = (active: boolean) =>
    cn(
      'transition-colors',
      compact
        ? 'flex items-center justify-center h-10 w-10 mx-auto my-0.5 rounded-md'
        : 'flex items-center gap-3 rounded-md px-4 py-2.5 text-[14px]',
      active
        ? 'bg-gray-700/60 text-teal-400'
        : 'text-gray-300 hover:bg-gray-700/70 hover:text-teal-400',
    );

  const renderItem = (item: Item) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const inner = (
      <>
        <Icon size={compact ? 18 : 16} className="shrink-0" />
        {!compact && <span className="truncate">{item.label}</span>}
      </>
    );

    if (item.search) {
      return (
        <button
          key={item.href}
          type="button"
          onClick={openSearch}
          title={compact ? item.label : undefined}
          aria-label={item.label}
          className={cn(rowClass(false), 'w-full text-left')}
        >
          {inner}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        title={compact ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
        className={rowClass(active)}
      >
        {inner}
      </Link>
    );
  };

  const sectionLabel = (label: string) =>
    compact ? (
      <div className="my-2 mx-auto h-px w-6 bg-gray-700" />
    ) : (
      <div className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </div>
    );

  return (
    <aside
      className={cn(
        'hidden md:block shrink-0 transition-[width] duration-200',
        compact ? 'w-[52px]' : 'w-[260px]',
      )}
      aria-label="Primary navigation"
    >
      {/* Hidden SearchCommand instance: mounts the global Cmd/Ctrl+K listener so
          the Search row can open the dialog. The dialog itself is portal-rendered
          and unaffected by the wrapper being hidden. */}
      <div className="hidden">
        <SearchCommand renderAs="text" label="Search" initialStocks={initialStocks} />
      </div>

      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pb-4 scrollbar-hide rounded-xl border border-gray-700 bg-gray-800 ring-1 ring-gray-700/50">
        {/* Accent hairline — tinted by the member's accent via --brand. */}
        <div className="h-[2px] bg-gradient-to-r from-teal-400/0 via-teal-400/70 to-teal-400/0" />

        {/* Toggle row — anchored top so the hamburger never shifts on screen. */}
        <button
          type="button"
          onClick={toggle}
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
            className={cn(rowClass(false))}
          >
            <ArrowLeft size={compact ? 18 : 16} className="shrink-0" />
            {!compact && <span className="truncate">Back to Feedcast</span>}
          </a>

          <div className="my-2 h-px bg-gray-700/70" />

          {MAIN_ITEMS.map(renderItem)}

          {sectionLabel('Reports')}
          {REPORTS_ITEMS.map(renderItem)}

          {sectionLabel('Markets')}
          {MARKETS_ITEMS.map(renderItem)}

          {sectionLabel('More')}
          {MORE_ITEMS.map(renderItem)}
        </nav>
      </div>
    </aside>
  );
}

export default SideNav;

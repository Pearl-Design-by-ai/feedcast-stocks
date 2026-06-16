/**
 * Icon maps for the categorized left menu — shared by the desktop SideNav and
 * the mobile drawer so both stay in sync. Keyed by route for items and by
 * section id for category headers.
 */
import {
    LayoutDashboard,
    Search,
    Star,
    Bell,
    Radar,
    Siren,
    Scale,
    Sparkles,
    GraduationCap,
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
    ArrowLeftRight,
    Palette,
    Info,
    LifeBuoy,
    Code,
    Home,
    ListChecks,
    Lightbulb,
    Settings2,
    Briefcase,
    type LucideIcon,
} from 'lucide-react';

export const NAV_ICONS: Record<string, LucideIcon> = {
    '/': LayoutDashboard,
    '/search': Search,
    '/watchlist': Star,
    '/alerts': Bell,
    '/bubble-detector': Radar,
    '/crash-detector': Siren,
    '/valuation': Scale,
    '/portfolio-lab': Briefcase,
    '/ask': Sparkles,
    '/learn': GraduationCap,
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
    '/compare': ArrowLeftRight,
    '/appearance': Palette,
    '/about': Info,
    '/help': LifeBuoy,
    '/api-docs': Code,
};

export const SECTION_ICONS: Record<string, LucideIcon> = {
    home: Home,
    lists: ListChecks,
    research: Lightbulb,
    markets: Activity,
    more: Settings2,
};

export const NAV_FALLBACK_ICON = LayoutDashboard;

// Catalog for the /reports section — four daily, live-generated report pages
// inspired by desk-style briefing decks (macro brief, index technicals,
// volatility regime, portfolio health) but built Feedcast-style: every number
// is computed from live ETF quotes when the page is opened, charts come from
// TradingView embeds, and anything we can't verify is simply not shown.
//
// Each report gets its own accent so the four briefs are recognizable at a
// glance. Accent classes are written out in full (no string interpolation) so
// Tailwind's static scanner keeps them.

export type ReportTone = 'pos' | 'neg' | 'warn' | 'neutral';

export interface ReportDef {
    slug: string;
    /** Short uppercase badge, e.g. "MACRO COMPASS". */
    code: string;
    name: string;
    tagline: string;
    description: string;
    /** Accent utility classes — text / border / chip background. */
    accentText: string;
    accentBorder: string;
    accentChip: string;
    /** "How it works" bullets shown on the hub card. */
    how: string[];
}

export const REPORTS: ReportDef[] = [
    {
        slug: 'macro-compass',
        code: 'MACRO COMPASS',
        name: 'Macro Compass',
        tagline: 'Rates, dollar, credit and inflation hedges — one macro read.',
        description:
            'A daily macro brief built from liquid proxy ETFs: Treasuries across the curve, the dollar, gold, oil and credit. A traffic-light alarm panel flags where stress is building, and the economic calendar shows what could move it next.',
        accentText: 'text-amber-400',
        accentBorder: 'border-amber-400/30',
        accentChip: 'bg-amber-400/10 text-amber-400',
        how: [
            'Fetches live quotes for curve, dollar, credit and commodity proxy ETFs.',
            'Scores each macro axis into a green / amber / red alarm panel.',
            'Pairs the read with the 10-year yield chart and the macro event calendar.',
        ],
    },
    {
        slug: 'index-pulse',
        code: 'INDEX PULSE',
        name: 'Index Pulse',
        tagline: 'US indices and sector rotation — breadth, leadership, verdict.',
        description:
            'A technical pulse of the US tape: the major index ETFs, equal-weight vs cap-weight participation, and a live sector leadership board across all 11 SPDRs — fused into a single one-line verdict on today’s session.',
        accentText: 'text-teal-400',
        accentBorder: 'border-teal-400/30',
        accentChip: 'bg-teal-400/10 text-teal-400',
        how: [
            'Quotes SPY, QQQ, IWM, DIA and RSP plus all 11 sector SPDRs.',
            'Computes breadth (sectors advancing) and the equal-weight vs SPY spread.',
            'Ranks sector leadership and renders the S&P 500 heatmap below it.',
        ],
    },
    {
        slug: 'vol-radar',
        code: 'VOL RADAR',
        name: 'Vol Radar',
        tagline: 'Volatility regime and risk appetite — is the market hedging?',
        description:
            'Reads today’s risk regime from how equities and volatility proxies move together — rally, hedged rally, vol spike or risk-off — cross-checked against credit, bonds and gold, with the VIX chart and a plain-language vol glossary.',
        accentText: 'text-violet-400',
        accentBorder: 'border-violet-400/30',
        accentChip: 'bg-violet-400/10 text-violet-400',
        how: [
            'Compares the day’s SPY move against the VIXY volatility proxy.',
            'Cross-checks the regime against credit (HYG), duration (TLT) and gold.',
            'Includes the VIX chart and a glossary of the vol terms that matter.',
        ],
    },
    {
        slug: 'holdings-health',
        code: 'HOLDINGS HEALTH',
        name: 'Holdings Health',
        tagline: 'A technical health check across everything you watch.',
        description:
            'Scans your watchlist with live data and triages every symbol: what surged, what broke down, and what just drifted — each with a suggested next step (review the stop, trail tighter, or leave it alone).',
        accentText: 'text-sky-400',
        accentBorder: 'border-sky-400/30',
        accentChip: 'bg-sky-400/10 text-sky-400',
        how: [
            'Pulls your watchlist and fetches live prices for every symbol.',
            'Triages each name by today’s move into surge / strong / calm / weak / drop.',
            'Summarizes the book in an exec grid: advancers, decliners, sharp movers.',
        ],
    },
];

export function getReport(slug: string): ReportDef | undefined {
    return REPORTS.find((r) => r.slug === slug);
}

/** Symbols each report quotes. ETF proxies only — they always have live feeds. */
export const MACRO_SYMBOLS = {
    shortRates: 'SHY', // 1-3y Treasuries
    midRates: 'IEF', // 7-10y Treasuries
    longRates: 'TLT', // 20y+ Treasuries
    dollar: 'UUP',
    gold: 'GLD',
    oil: 'USO',
    tips: 'TIP',
    highYield: 'HYG',
    investGrade: 'LQD',
} as const;

export const INDEX_SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA', 'RSP'] as const;

export const SECTOR_SYMBOLS: Array<{ symbol: string; label: string }> = [
    { symbol: 'XLK', label: 'Technology' },
    { symbol: 'XLF', label: 'Financials' },
    { symbol: 'XLV', label: 'Health Care' },
    { symbol: 'XLY', label: 'Consumer Disc.' },
    { symbol: 'XLP', label: 'Consumer Staples' },
    { symbol: 'XLE', label: 'Energy' },
    { symbol: 'XLI', label: 'Industrials' },
    { symbol: 'XLB', label: 'Materials' },
    { symbol: 'XLU', label: 'Utilities' },
    { symbol: 'XLRE', label: 'Real Estate' },
    { symbol: 'XLC', label: 'Communication' },
];

export const VOL_SYMBOLS = {
    vol: 'VIXY', // short-term VIX futures ETF — tradable volatility proxy
    spx: 'SPY',
    ndx: 'QQQ',
    bonds: 'TLT',
    gold: 'GLD',
    credit: 'HYG',
} as const;

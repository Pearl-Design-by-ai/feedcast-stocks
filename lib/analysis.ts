/**
 * Catalog for the /analysis section — a hub of live, data-driven analysis
 * tools styled as a card deck (badge, title, blurb, "How it works?", open
 * link). Every tool computes from real EOD closes (Yahoo via
 * fetchDailyCloses, cached 6h) and live calendar/AI context when it adds
 * something; nothing is a canned report.
 */

export interface AnalysisTool {
    slug: string;
    /** Uppercase badge, e.g. "TREND CHECK". */
    code: string;
    name: string;
    tagline: string;
    description: string;
    /** "How it works?" bullets on the hub card. */
    how: string[];
    /** Static Tailwind accent classes. */
    text: string;
    chip: string;
    border: string;
}

export const ANALYSIS_TOOLS: AnalysisTool[] = [
    {
        slug: 'trend-check',
        code: 'TREND CHECK',
        name: 'Trend Check',
        tagline: 'Is this stock really trending — or just noisy?',
        description:
            'Reads two years of daily closes and scores the trend the way a technician would: price vs the 50- and 200-day averages, the golden/death cross, 1/3/6-month momentum and distance from the 52-week high — then gives one verdict with its reasons.',
        how: [
            'Fetches 2 years of daily closes for your symbol.',
            'Checks price vs SMA50/SMA200, the 50/200 cross and multi-horizon momentum.',
            'Returns a single verdict — real uptrend, recovering, choppy or downtrend — with each signal shown.',
        ],
        text: 'text-emerald-400',
        chip: 'bg-emerald-400/10 text-emerald-400',
        border: 'hover:border-emerald-400/40',
    },
    {
        slug: 'swing-scout',
        code: 'SWING SCOUT',
        name: 'Swing Scout',
        tagline: 'Entry, target and stop levels — with the reasoning attached.',
        description:
            'Maps the recent swing structure: the 20-day range, 3-month support and resistance, and where price sits inside them. Builds a framework plan — entry trigger, protective stop, realistic target — and computes the risk/reward so you can judge it.',
        how: [
            'Finds the 20-day high/low and 3-month support/resistance from closes.',
            'Drafts a plan: breakout or pullback entry, stop under the swing low, target at prior resistance.',
            'Computes risk/reward and flags setups where the math is against you.',
        ],
        text: 'text-sky-400',
        chip: 'bg-sky-400/10 text-sky-400',
        border: 'hover:border-sky-400/40',
    },
    {
        slug: 'trail-stop',
        code: 'TRAIL STOP',
        name: 'Trail Stop Planner',
        tagline: 'A rule-based exit plan for a winning position.',
        description:
            'Four trailing-stop methods on one screen — EMA10 (tight), EMA20, SMA50 (loose) and a volatility stop off the 20-day high — each with its current level and distance from price, so you can pick the leash that fits how much heat you can take.',
        how: [
            'Computes EMA10 / EMA20 / SMA50 and a volatility-based stop from the closes.',
            'Shows each stop level, its distance from the last close, and how tight it rides.',
            'Explains when each method keeps you in vs shakes you out.',
        ],
        text: 'text-amber-400',
        chip: 'bg-amber-400/10 text-amber-400',
        border: 'hover:border-amber-400/40',
    },
    {
        slug: 'earnings-radar',
        code: 'EARNINGS RADAR',
        name: 'Earnings Radar',
        tagline: 'Walk into earnings night knowing the setup.',
        description:
            'Finds the next report date, measures how much the stock has already run into it, reads 20-day realized volatility for event-risk context, and asks the AI for the grounded bull and bear case — the pre-earnings picture on one page.',
        how: [
            'Looks up the next earnings date from the live calendar.',
            'Measures the pre-earnings run-up (1m/3m) and 20-day realized volatility.',
            'Adds an AI bull vs bear case grounded in current data.',
        ],
        text: 'text-violet-400',
        chip: 'bg-violet-400/10 text-violet-400',
        border: 'hover:border-violet-400/40',
    },
    {
        slug: 'opportunity-scan',
        code: 'OPPORTUNITY SCAN',
        name: 'Opportunity Scan',
        tagline: 'A daily sweep for setups across liquid US names.',
        description:
            'Scans a curated universe of liquid US stocks and ETFs on end-of-day data and sorts what it finds into three buckets: momentum leaders, oversold bounce candidates (RSI), and names pressing their 52-week highs.',
        how: [
            'Pulls EOD history for a curated ~24-symbol universe (cached, rate-limit safe).',
            'Computes 1-month momentum, RSI(14) and distance from the 52-week high for each.',
            'Buckets the results: leaders, oversold watch, breakout watch — with the numbers shown.',
        ],
        text: 'text-rose-400',
        chip: 'bg-rose-400/10 text-rose-400',
        border: 'hover:border-rose-400/40',
    },
];

export function getAnalysisTool(slug: string): AnalysisTool | undefined {
    return ANALYSIS_TOOLS.find((t) => t.slug === slug);
}

/** Curated scan universe — liquid, recognizable, mixed sectors + index ETFs. */
export const SCAN_UNIVERSE: string[] = [
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO',
    'JPM', 'V', 'UNH', 'XOM', 'COST', 'HD', 'NFLX', 'AMD',
    'CRM', 'DIS', 'BA', 'PFE',
    'SPY', 'QQQ', 'IWM', 'DIA',
];

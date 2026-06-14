/**
 * Daily valuation screen for the Bubble Detector.
 *
 * multpl.com/shiller-pe shows the *market-wide* Shiller CAPE — it isn't
 * computable per single stock from free data, so this screen ranks individual
 * names by trailing P/E (the accessible valuation proxy) to surface the
 * cheapest and most expensive large-caps. Built as a daily batch: a background
 * scan fetches one Finnhub metric call per symbol (rate-limit-paced, cached
 * 24h), folds the universe into two ranked lists, and stores the result in KV
 * for the page to read. See lib/actions/valuation.actions.ts.
 */

export interface ValuationEntry {
    symbol: string;
    /** Last trade / close. */
    price: number | null;
    /** Trailing P/E (the ranking metric, always > 0 here). */
    pe: number;
    /** Trailing price/sales. */
    ps: number | null;
    /** Price/book. */
    pb: number | null;
    /** Dividend yield %. */
    dy: number | null;
    /** Market cap, in millions USD. */
    mktCap: number | null;
    /** Return on equity %, trailing. */
    roe: number | null;
    /** Net profit margin %, trailing. */
    npm: number | null;
    /** Revenue growth %, YoY trailing. */
    revGrowth: number | null;
    /** 52-week price return %. */
    ret1y: number | null;
    /** Beta vs the market. */
    beta: number | null;
    /** 52-week high. */
    hi52: number | null;
    /** 52-week low. */
    lo52: number | null;
}

export interface ValuationScreen {
    /** ISO timestamp of the last rebuild. */
    asOf: string;
    /** Trading session (ET date) this screen was built for — see currentSession(). */
    session: string;
    /** True once every universe symbol has been fetched for this session. */
    complete: boolean;
    /** How many universe names currently have a usable P/E. */
    scanned: number;
    /** Universe size. */
    universe: number;
    /** Names with no positive trailing earnings (excluded from the P/E ranking). */
    noEarnings: number;
    cheapest: ValuationEntry[];
    priciest: ValuationEntry[];
}

/**
 * The most recent completed US trading session as an ET date string
 * (YYYY-MM-DD). Before 16:00 ET it's the prior session; weekends roll back to
 * Friday. Used to refresh the screen once after each market close rather than
 * on a rolling clock.
 */
function etParts(d: Date) {
    const f = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
    });
    const m: Record<string, string> = {};
    for (const p of f.formatToParts(d)) m[p.type] = p.value;
    return { y: +m.year, mo: +m.month, d: +m.day, hour: +m.hour % 24, weekday: m.weekday };
}

export function currentSession(now: Date = new Date()): string {
    let d = now;
    if (etParts(d).hour < 16) d = new Date(d.getTime() - 86_400_000); // before the close → prior day
    for (let i = 0; i < 6; i++) {
        const w = etParts(d).weekday;
        if (w !== 'Sat' && w !== 'Sun') break;
        d = new Date(d.getTime() - 86_400_000);
    }
    const p = etParts(d);
    return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** How many names each ranked list holds. */
export const VALUATION_TOP_N = 100;

/** KV keys (versioned so a shape change can't read stale data). */
export const VAL_METRICS_KEY = 'val:metrics:v1';
export const VAL_SCREEN_KEY = 'val:screen:v1';
export const VAL_LOCK_KEY = 'val:scan:lock:v1';

/**
 * Curated universe of liquid US large-caps across every sector, so the
 * cheapest/priciest extremes are meaningful. ~190 names — large enough to fill
 * two lists of up to 100, small enough that the paced daily scan stays within
 * the Finnhub free-tier budget. Dotted tickers (BRK.B etc.) are omitted to
 * avoid symbol-format issues.
 */
export const VALUATION_UNIVERSE: string[] = [
    // Mega-cap tech, semis & software
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AVGO', 'ORCL', 'CRM', 'ADBE',
    'CSCO', 'ACN', 'IBM', 'INTC', 'AMD', 'QCOM', 'TXN', 'INTU', 'NOW', 'AMAT',
    'MU', 'ADI', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'PANW', 'CRWD', 'FTNT', 'PLTR',
    'SNOW', 'NET', 'DDOG', 'ZS', 'WDAY', 'DELL', 'HPQ', 'MRVL', 'ON', 'MCHP',
    'ANET', 'SMCI', 'UBER', 'ABNB', 'SHOP', 'SPOT', 'COIN', 'PYPL', 'ROKU', 'NFLX',
    // Communication & media
    'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'WBD', 'CHTR', 'EA', 'TTWO',
    // Consumer discretionary & retail
    'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'TJX', 'BKNG', 'MAR', 'HLT', 'CMG',
    'ORLY', 'AZO', 'ROST', 'YUM', 'LULU', 'GM', 'F', 'TSLA', 'RIVN', 'APTV',
    // Consumer staples
    'WMT', 'COST', 'PG', 'KO', 'PEP', 'PM', 'MO', 'MDLZ', 'CL', 'KMB',
    'GIS', 'KHC', 'HSY', 'STZ', 'KDP', 'MNST', 'TGT', 'KR', 'DG', 'DLTR',
    // Healthcare, pharma, biotech & devices
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'BMY',
    'AMGN', 'GILD', 'VRTX', 'REGN', 'ISRG', 'MDT', 'SYK', 'BSX', 'CI', 'CVS',
    'ELV', 'HCA', 'ZTS', 'BDX', 'MRNA', 'BIIB',
    // Financials, banks, insurance & payments
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'SCHW', 'BLK', 'SPGI', 'AXP',
    'V', 'MA', 'USB', 'PNC', 'TFC', 'COF', 'BK', 'CB', 'PGR', 'MET',
    'PRU', 'AIG', 'MMC', 'ICE', 'CME', 'AON', 'TRV', 'ALL',
    // Industrials
    'CAT', 'DE', 'BA', 'HON', 'GE', 'UNP', 'UPS', 'FDX', 'LMT', 'RTX',
    'NOC', 'GD', 'MMM', 'EMR', 'ETN', 'ITW', 'CSX', 'NSC', 'WM', 'RSG',
    'PH', 'ROP', 'CARR', 'PCAR', 'CPRT', 'FAST', 'PAYX', 'ADP',
    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'WMB',
    'KMI', 'OKE', 'HES', 'DVN', 'HAL', 'BKR', 'FANG',
    // Materials
    'LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'NUE', 'DOW', 'CTVA', 'VMC', 'MLM',
    // Utilities
    'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'PEG', 'ED', 'VST', 'CEG',
    // REITs
    'PLD', 'AMT', 'EQIX', 'CCI', 'PSA', 'O', 'SPG', 'WELL', 'DLR', 'VICI',
];

/**
 * Valuation — public type contract + the shared trading-session helper.
 *
 * The curated universe, the P/E and PEG rankings and the KV-backed daily scan run in
 * the PRIVATE markets-engine (driven by its own cron); the public app reads the
 * finished screen via lib/actions/valuation.actions.ts. `currentSession()`
 * stays here because many public modules (crons, AI commentary, stock-AI) share
 * it — it is a plain market-calendar utility, not proprietary.
 */

export interface ValuationEntry {
    symbol: string;
    /** Last trade / close. */
    price: number | null;
    /** Trailing P/E. Null only on forward-ranked rows with no positive TTM earnings. */
    pe: number | null;
    /** Forward P/E — price ÷ next-twelve-month consensus EPS. */
    fpe: number | null;
    /** Trailing PEG — trailing P/E ÷ trailing EPS growth. Negative when earnings shrank. */
    peg: number | null;
    /** Forward PEG — forward P/E ÷ expected EPS growth. */
    fpeg: number | null;
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
    /** Names with no positive trailing earnings (excluded from the trailing ranking). */
    noEarnings: number;
    /** How many universe names currently have a usable forward P/E. */
    scannedF?: number;
    /** Names with no positive forward estimate (excluded from the forward ranking). */
    noForward?: number;
    /** How many universe names currently have a usable trailing PEG. */
    scannedP?: number;
    /** Names with no positive trailing PEG — no growth, or shrinking earnings. */
    noPeg?: number;
    /** How many universe names currently have a usable forward PEG. */
    scannedFP?: number;
    /** Names with no positive forward PEG. */
    noFpeg?: number;
    cheapest: ValuationEntry[];
    priciest: ValuationEntry[];
    /**
     * The same universe ranked by forward P/E. Optional: a screen stored by an
     * engine build older than the forward-P/E change won't carry them, so the
     * UI falls back to the trailing ranking until the next scan tick rebuilds it.
     */
    cheapestF?: ValuationEntry[];
    priciestF?: ValuationEntry[];
    /**
     * The same universe ranked by PEG — the multiple set against growth. Optional
     * for the same reason as the forward lists: a screen stored by an engine build
     * older than the PEG change won't carry them, and the UI simply doesn't offer
     * those rankings until the next scan tick rebuilds it.
     */
    cheapestP?: ValuationEntry[];
    priciestP?: ValuationEntry[];
    cheapestFP?: ValuationEntry[];
    priciestFP?: ValuationEntry[];
}

/**
 * The most recent completed US trading session as an ET date string
 * (YYYY-MM-DD). Before 16:00 ET it's the prior session; weekends roll back to
 * Friday. Shared by the alert cron, AI commentary and stock-AI shims.
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

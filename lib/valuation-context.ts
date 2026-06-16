/**
 * Market-wide valuation context for the Valuation Screen.
 *
 * The per-stock screen ranks names by trailing P/E (computed live). This module
 * adds the *whole-market* picture the screen can't compute from free per-stock
 * data: broad valuation gauges (Shiller CAPE, the Buffett Indicator) shown as
 * EXTERNALLY-SOURCED REFERENCE figures — explicitly not calculated here — plus a
 * curated read on which sectors look cheap vs expensive and where the rotation
 * may go next. All of section B/C is analyst judgment current to mid-2026,
 * clearly framed as such (not a live feed).
 */

export type Verdict = 'cheap' | 'fair' | 'rich' | 'extreme';

export interface MarketGauge {
    name: string;
    /** Reference level, externally sourced (not computed here). */
    level: string;
    /** Long-run average / "fair" anchor for context. */
    average: string;
    /** Rough historical percentile, as a sentence. */
    percentile: string;
    verdict: Verdict;
    /** What it measures, in one line. */
    what: string;
    source: { label: string; url: string };
}

/**
 * Reference gauges — levels are approximate, externally sourced and current to
 * ~mid-2026. They are NOT computed by Feedcast; follow each source link for the
 * live figure. Shown for context, not as precise live data.
 */
export const MARKET_GAUGES: MarketGauge[] = [
    {
        name: 'Shiller CAPE (CAPE-10)',
        level: '≈ 37–39×',
        average: 'Long-run ≈ 17×',
        percentile: 'Around the ~95th percentile of history — only 1929 and 1999–2000 were clearly higher.',
        verdict: 'extreme',
        what: 'S&P 500 price ÷ 10-year inflation-adjusted average earnings. Smooths the cycle to gauge how richly the whole market is priced.',
        source: { label: 'multpl.com / Shiller data', url: 'https://www.multpl.com/shiller-pe' },
    },
    {
        name: 'Buffett Indicator',
        level: '≈ 200–210%',
        average: '"Fair" ≈ 100–120%',
        percentile: 'Far above the long-term trend line — near record highs, a level Buffett once called "playing with fire."',
        verdict: 'extreme',
        what: 'Total US stock-market capitalization ÷ GDP. A blunt but famous read on the market vs the real economy.',
        source: { label: 'currentmarketvaluation.com', url: 'https://www.currentmarketvaluation.com/models/buffett-indicator.php' },
    },
    {
        name: 'S&P 500 forward P/E',
        level: '≈ 21–23×',
        average: '10-yr ≈ 18×, long-run ≈ 16×',
        percentile: 'Top decile of the past 35 years — outside the 2000 and 2021 peaks.',
        verdict: 'rich',
        what: 'Index price ÷ next-12-month expected earnings. The headline forward multiple most desks quote.',
        source: { label: 'FactSet / Yardeni (public summaries)', url: 'https://yardeni.com/' },
    },
];

export const VERDICT_META: Record<Verdict, { label: string; tone: 'pos' | 'neutral' | 'warn' | 'neg' }> = {
    cheap: { label: 'Cheap', tone: 'pos' },
    fair: { label: 'Fair value', tone: 'neutral' },
    rich: { label: 'Expensive', tone: 'warn' },
    extreme: { label: 'Extremely stretched', tone: 'neg' },
};

/** The one-line overall verdict shown under the gauges. */
export const MARKET_VERDICT = {
    headline: 'Expensive — but the richness is concentrated',
    body: 'On every broad gauge the US market sits in the top decile of its own history, driven by a handful of mega-cap AI winners. Strip those out and the median stock, small-caps and several old-economy sectors are far more reasonably priced — which is exactly why the cheapest/most-expensive split below, and the sector and rotation reads, matter more than the index headline.',
};

// ---------------------------------------------------------------------------
// Sector cheap/expensive map — analyst read, mid-2026.
// ---------------------------------------------------------------------------

export interface SectorRead {
    sector: string;
    /** Relative-valuation tag. */
    tag: 'cheap' | 'rich';
    /** One-line rationale. */
    note: string;
}

export const CHEAP_SECTORS: SectorRead[] = [
    { sector: 'Energy', tag: 'cheap', note: 'Low single-digit to mid-teens P/Es, heavy buybacks and dividends; priced for weak oil and ESG outflows.' },
    { sector: 'Financials / Banks', tag: 'cheap', note: 'Trading near or below book in places; steep-curve and credit-normalization optionality not in the price.' },
    { sector: 'Healthcare', tag: 'cheap', note: 'Pharma and managed-care de-rated on policy fear despite steady cash flows — a classic defensive value pocket.' },
    { sector: 'Consumer Staples', tag: 'cheap', note: 'Out of favor vs growth, but stable earnings and yield — where money rotates when the cycle turns.' },
    { sector: 'Small-cap value (Russell 2000)', tag: 'cheap', note: 'Among the widest small-vs-large valuation gaps in decades; highly rate-sensitive call option on a soft landing.' },
];

export const RICH_SECTORS: SectorRead[] = [
    { sector: 'Technology / Semiconductors', tag: 'rich', note: 'AI leaders carry premium multiples on real growth — but the bar is high and concentration risk is extreme.' },
    { sector: 'AI infrastructure & power', tag: 'rich', note: 'Data-center, utility and equipment names re-rated hard on the capex theme; pricing years of flawless build-out.' },
    { sector: 'Consumer Discretionary (mega-cap)', tag: 'rich', note: 'A few index heavyweights drag the sector multiple well above its components\' median.' },
    { sector: 'Momentum / high-growth software', tag: 'rich', note: 'Rich price/sales multiples that depend on rates staying friendly and growth not slipping.' },
];

// ---------------------------------------------------------------------------
// Rotation read — where leadership is and where it could go.
// ---------------------------------------------------------------------------

export interface RotationNote {
    title: string;
    body: string;
    tone: 'now' | 'pivot' | 'small' | 'dow';
}

export const ROTATION_NOTES: RotationNote[] = [
    {
        title: 'Where the rotation is now',
        tone: 'now',
        body: 'Leadership is narrow and large-cap-growth: AI semis, hyperscalers and the power/infrastructure feeding them. Cap-weighted indices keep making highs while the equal-weight index and most sectors lag — the textbook late-cycle "fewer and fewer generals" pattern.',
    },
    {
        title: 'Where it could pivot',
        tone: 'pivot',
        body: 'Two credible paths. Soft landing + rate cuts → a broadening into value, cyclicals and small-caps (the laggards play catch-up). Growth scare → a defensive rotation into staples, healthcare, utilities and quality, with the rich AI complex de-rating first.',
    },
    {
        title: 'Russell 2000 (small-caps)',
        tone: 'small',
        body: 'The cheapest corner of US equity vs large-cap in decades and the most leveraged to falling rates — the classic broadening trade if the Fed eases into a still-growing economy. The catch: small-caps carry more floating-rate debt and weaker balance sheets, so they also fall hardest if a recession lands instead.',
    },
    {
        title: 'Dow / old-economy value',
        tone: 'dow',
        body: 'The price-weighted Dow tilts to industrials, financials, healthcare and staples — lower multiples and steadier earnings than the Nasdaq. It is the natural destination for a value/defensive rotation: it lags in an AI melt-up but cushions a growth-led drawdown.',
    },
];

export const VALUATION_CONTEXT_SOURCES: Array<{ label: string; url: string }> = [
    { label: 'Shiller CAPE — multpl.com', url: 'https://www.multpl.com/shiller-pe' },
    { label: 'Buffett Indicator — Current Market Valuation', url: 'https://www.currentmarketvaluation.com/models/buffett-indicator.php' },
    { label: 'Sector & forward P/Es — Yardeni Research', url: 'https://yardeni.com/' },
];

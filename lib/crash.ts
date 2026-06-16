/**
 * Crash Detector — cycle-risk scoring engine + curated framework content.
 *
 * The brief: objectively assess how late we are in the cycle and the odds of a
 * correction / recession / crash — WITHOUT assuming one is coming. Two layers:
 *
 *   1. LIVE indicators computed from real end-of-day data (no fabricated
 *      numbers) — yield curve, credit spreads, breadth, volatility,
 *      concentration, trend, drawdown, speculative froth. See crash-scan.ts.
 *   2. STRUCTURAL / cycle context — the long-cycle clock (Juglar, Benner,
 *      Kitchin, Kuznets, 18-yr real-estate, Dalio long-term debt) computed
 *      from dated anchors, plus an analyst read on the slow-moving macro
 *      indicators a daily price feed can't see (debt loads, housing, PE/VC).
 *      Clearly framed as judgment, current to mid-2026.
 *
 * Everything is heuristic and informational — probabilities, not predictions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Risk read for a single indicator. "Bullish" = low crash risk, not "price up." */
export type Classification = 'bullish' | 'neutral' | 'bearish' | 'extreme';

/** Where an indicator's number comes from — keeps the live signals honest vs. judgment. */
export type Provenance = 'live' | 'structural';

export interface CrashIndicator {
    key: string;
    label: string;
    /** Short group for the scorecard: "Market", "Credit & Rates", "Cycle & Macro". */
    group: 'Market' | 'Credit & Rates' | 'Speculation' | 'Cycle & Macro';
    provenance: Provenance;
    classification: Classification;
    /** Relative importance — historically most-predictive signals weigh more. */
    weight: number;
    /** The measured value as a display string (e.g. "−0.42%", "VIX 18.4"), or null for structural. */
    value: string | null;
    /** One-line read of what the number means right now. */
    detail: string;
}

export interface CrashCycle {
    name: string;
    /** Typical length in years (display). */
    period: string;
    /** Anchor: the cycle's last major low/start (ISO date). */
    anchorISO: string;
    /** What the anchor represents. */
    anchorLabel: string;
    /** Nominal cycle length in years used to compute % progress. */
    lengthYears: number;
    /** Editorial note on where this clock points now. */
    note: string;
}

export interface CrashCyclePosition extends CrashCycle {
    /** Years elapsed since the anchor. */
    ageYears: number;
    /** 0–100 position through a nominal cycle length. */
    progressPct: number;
}

export interface HistoricalAnalog {
    year: string;
    name: string;
    /** Peak-to-trough decline. */
    drawdown: string;
    trigger: string;
    /** What was extreme going in. */
    setup: string;
    /** How similar today looks, 0–100 (analyst read). */
    similarity: number;
}

export interface CrashProbabilities {
    bull12m: number;
    correction: number;
    recession: number;
    bear: number;
    systemic: number;
}

export interface CrashScenario {
    horizon: string;
    base: string;
    risk: string;
}

export interface CrashReport {
    score: number;
    band: CrashBand;
    asOf: string;
    /** How many of the score's indicators are live-computed vs structural. */
    liveCount: number;
    structuralCount: number;
    indicators: CrashIndicator[];
    cycles: CrashCyclePosition[];
    analogs: HistoricalAnalog[];
    closestAnalog: HistoricalAnalog;
    probabilities: CrashProbabilities;
    scenarios: CrashScenario[];
    summary: string;
    topDrivers: CrashIndicator[];
    disagreements: CrashIndicator[];
    reasonsNoCrash: string[];
    reasonsUnderestimated: string[];
}

export interface CrashBand {
    label: string;
    tone: 'pos' | 'neutral' | 'warn' | 'neg' | 'crit';
    blurb: string;
}

// ---------------------------------------------------------------------------
// Scoring primitives
// ---------------------------------------------------------------------------

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Classification → 0–100 risk contribution. */
const CONTRIBUTION: Record<Classification, number> = {
    bullish: 12,
    neutral: 40,
    bearish: 68,
    extreme: 90,
};

export const CLASS_LABEL: Record<Classification, string> = {
    bullish: 'Bullish',
    neutral: 'Neutral',
    bearish: 'Bearish',
    extreme: 'Extreme Risk',
};

/** Weighted composite of every indicator that has a reading → 0–100. */
export function compositeScore(indicators: CrashIndicator[]): number {
    const totalW = indicators.reduce((s, i) => s + i.weight, 0);
    if (totalW === 0) return 0;
    const sum = indicators.reduce((s, i) => s + i.weight * CONTRIBUTION[i.classification], 0);
    return Math.round(sum / totalW);
}

/** The 0–100 → cycle-phase band. */
export function crashBand(score: number): CrashBand {
    if (score < 20) return { label: 'Deep Value / Recovery', tone: 'pos', blurb: 'Washed-out, post-capitulation conditions — historically where forward returns are highest.' };
    if (score < 40) return { label: 'Early Expansion', tone: 'pos', blurb: 'A young cycle with room to run; risk is low and broadening.' };
    if (score < 60) return { label: 'Mid-Cycle', tone: 'neutral', blurb: 'Healthy expansion, no broad excess yet — the longest, most boring phase.' };
    if (score < 75) return { label: 'Late Cycle', tone: 'warn', blurb: 'Excess is building in pockets. Returns can still be good, but the margin of safety is thinning.' };
    if (score < 90) return { label: 'High Risk', tone: 'neg', blurb: 'Multiple late-cycle signals aligned. Drawdown risk is materially elevated — defense matters.' };
    return { label: 'Extreme Bubble / Crash Watch', tone: 'crit', blurb: 'Bubble-grade excess on several fronts. The setup for a major correction is in place.' };
}

/**
 * Score → probability set. A documented, monotonic mapping — illustrative, NOT
 * a forecast, and the events overlap (a correction can precede a recession).
 */
export function scoreToProbabilities(score: number): CrashProbabilities {
    return {
        bull12m: Math.round(clamp(74 - 0.58 * score, 18, 85)),
        correction: Math.round(clamp(18 + 0.5 * score, 20, 80)),
        recession: Math.round(clamp(8 + 0.62 * (score - 28), 6, 78)),
        bear: Math.round(clamp(0.52 * (score - 42), 3, 72)),
        systemic: Math.round(clamp(0.34 * (score - 58), 1, 42)),
    };
}

/** A small ± band around a probability to convey that these are estimates. */
export function probRange(p: number): string {
    const lo = Math.max(0, p - 6);
    const hi = Math.min(100, p + 8);
    return `${lo}–${hi}%`;
}

// ---------------------------------------------------------------------------
// Indicator math helpers (shared by the live scan)
// ---------------------------------------------------------------------------

export const lastOf = (a: number[]): number | null => (a.length ? a[a.length - 1] : null);

export function smaOf(closes: number[], k: number): number | null {
    const n = closes.length;
    if (n < k) return null;
    let s = 0;
    for (let i = n - k; i < n; i++) s += closes[i];
    return s / k;
}

/** % return `back` sessions ago → now. */
export function retOf(closes: number[], back: number): number | null {
    const n = closes.length;
    const past = n - 1 - back >= 0 ? closes[n - 1 - back] : undefined;
    const last = lastOf(closes);
    return past && past > 0 && last != null ? (last / past - 1) * 100 : null;
}

/** % the last close sits above/below its k-day average. */
export function extOf(closes: number[], k: number): number | null {
    const sma = smaOf(closes, k);
    const last = lastOf(closes);
    return sma && last != null ? (last / sma - 1) * 100 : null;
}

/** % off the trailing 52-week (≈252d) high (≤ 0). */
export function offHighOf(closes: number[]): number | null {
    const last = lastOf(closes);
    if (last == null) return null;
    const win = closes.slice(-252);
    const hi = Math.max(...win);
    return hi > 0 ? (last / hi - 1) * 100 : null;
}

/** RSI(14), Wilder-smoothed. */
export function rsiOf(closes: number[]): number | null {
    const n = closes.length;
    if (n < 15) return null;
    let g = 0, l = 0;
    for (let i = 1; i <= 14; i++) {
        const d = closes[i] - closes[i - 1];
        if (d >= 0) g += d; else l -= d;
    }
    let ag = g / 14, al = l / 14;
    for (let i = 15; i < n; i++) {
        const d = closes[i] - closes[i - 1];
        ag = (ag * 13 + Math.max(d, 0)) / 14;
        al = (al * 13 + Math.max(-d, 0)) / 14;
    }
    return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

// ---------------------------------------------------------------------------
// Symbols the live scan pulls (Yahoo EOD, via fetchDailyCloses)
// ---------------------------------------------------------------------------

export const CRASH_SYMBOLS = {
    spx: 'SPY',
    equalWeight: 'RSP',
    vix: '^VIX',
    tenYear: '^TNX', // 10y yield ×10
    threeMonth: '^IRX', // 13-week T-bill discount %
    hy: 'HYG', // high-yield credit
    ig: 'LQD', // investment-grade credit
    gold: 'GLD',
    longBond: 'TLT',
    sectors: ['XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'XLP', 'XLI', 'XLB', 'XLU', 'XLRE', 'XLC'],
    froth: ['ARKK', 'BTC-USD', 'COIN', 'NVDA', 'PLTR', 'SMCI', 'MSTR'],
};

/** Every symbol the scan needs, de-duplicated. */
export const ALL_CRASH_SYMBOLS: string[] = Array.from(
    new Set([
        CRASH_SYMBOLS.spx,
        CRASH_SYMBOLS.equalWeight,
        CRASH_SYMBOLS.vix,
        CRASH_SYMBOLS.tenYear,
        CRASH_SYMBOLS.threeMonth,
        CRASH_SYMBOLS.hy,
        CRASH_SYMBOLS.ig,
        CRASH_SYMBOLS.gold,
        CRASH_SYMBOLS.longBond,
        ...CRASH_SYMBOLS.sectors,
        ...CRASH_SYMBOLS.froth,
    ])
);

// ---------------------------------------------------------------------------
// Structural / cycle overlay — analyst read, current to mid-2026.
// Clearly judgment, not a live feed. Kept deliberately conservative so the
// composite isn't dominated by opinion.
// ---------------------------------------------------------------------------

export const STRUCTURAL_INDICATORS: CrashIndicator[] = [
    {
        key: 'debt-cycle', label: 'Long-term debt cycle (Dalio)', group: 'Cycle & Macro',
        provenance: 'structural', classification: 'extreme', weight: 1.2, value: null,
        detail: 'Late in the long-term debt cycle: total debt/GDP near record highs and deficits monetized. Historically the backdrop for the most disruptive deleveragings.',
    },
    {
        key: 'govt-debt', label: 'Government debt & deficits', group: 'Cycle & Macro',
        provenance: 'structural', classification: 'bearish', weight: 0.9, value: null,
        detail: 'US federal debt/GDP ~120% with structurally large deficits and rising interest expense — limits fiscal-stimulus headroom into a downturn.',
    },
    {
        key: 'corp-debt', label: 'Corporate leverage & refinancing', group: 'Cycle & Macro',
        provenance: 'structural', classification: 'neutral', weight: 0.9, value: null,
        detail: 'Aggregate leverage elevated but interest coverage still adequate; a maturity wall looms, yet most issuers terming-out cheaply was already done.',
    },
    {
        key: 'housing', label: 'Housing affordability', group: 'Cycle & Macro',
        provenance: 'structural', classification: 'bearish', weight: 0.8, value: null,
        detail: 'Affordability among the worst on record — high prices met high mortgage rates. Supply-locked rather than forced-seller, which caps (but does not remove) downside.',
    },
    {
        key: 'pe-vc', label: 'Private equity & VC activity', group: 'Cycle & Macro',
        provenance: 'structural', classification: 'bearish', weight: 0.7, value: null,
        detail: 'Record dry powder against a frozen exit window; private marks lag public comparables, a classic late-cycle air-pocket waiting to be repriced.',
    },
    {
        key: 'ai-capex', label: 'AI capex & concentration risk', group: 'Speculation',
        provenance: 'structural', classification: 'extreme', weight: 1.0, value: null,
        detail: 'Index returns and capex concentrated in a handful of AI names. Genuine earnings, but a single-theme dependence reminiscent of 1999–2000 telecom/Nifty-Fifty.',
    },
    {
        key: 'money-supply', label: 'Money supply (M2) trend', group: 'Credit & Rates',
        provenance: 'structural', classification: 'neutral', weight: 0.6, value: null,
        detail: 'M2 re-expanding modestly after the 2022–23 contraction — supportive of liquidity, not yet a froth accelerant.',
    },
    {
        key: 'positioning', label: 'Institutional positioning', group: 'Speculation',
        provenance: 'structural', classification: 'neutral', weight: 0.6, value: null,
        detail: 'Equity allocations above average but short of prior euphoric peaks; systematic/vol-target strategies leave the market exposed to a fast de-grossing on a shock.',
    },
];

// ---------------------------------------------------------------------------
// Cycle clock — dated anchors, progress computed deterministically.
// ---------------------------------------------------------------------------

export const CRASH_CYCLES: CrashCycle[] = [
    {
        name: 'Equity / business (Juglar)', period: '7–11 yrs', anchorISO: '2020-03-23',
        anchorLabel: 'COVID low', lengthYears: 9,
        note: 'Measured from the 2020 crash low, the expansion is well-aged but not yet at the upper bound of a typical Juglar.',
    },
    {
        name: 'Benner cycle', period: '8/9/10 yr pattern', anchorISO: '2023-01-01',
        anchorLabel: 'Benner "good time to buy" (2023)', lengthYears: 6,
        note: 'Benner\'s 1875 map flagged 2023 as a buy and points to the next "panic"/sell window in the second half of the decade.',
    },
    {
        name: 'Kitchin (inventory)', period: '~3–5 yrs', anchorISO: '2022-10-13',
        anchorLabel: '2022 bear-market low', lengthYears: 4,
        note: 'The shortest clock — an inventory/earnings cycle that turned up off the 2022 low and is now mature.',
    },
    {
        name: 'Kuznets (infrastructure)', period: '15–25 yrs', anchorISO: '2009-03-09',
        anchorLabel: 'GFC low', lengthYears: 20,
        note: 'A long building/infrastructure swing; the AI data-center build-out is the current capex impulse.',
    },
    {
        name: '18-year real-estate cycle', period: '~18 yrs', anchorISO: '2012-01-01',
        anchorLabel: '2012 housing trough', lengthYears: 18,
        note: 'On the classic 18-year template (2006 peak → ~2012 low), the cycle points toward a peak window late this decade.',
    },
    {
        name: 'Long-term debt cycle (Dalio)', period: '50–75 yrs', anchorISO: '1981-01-01',
        anchorLabel: 'Disinflation peak in rates (1981)', lengthYears: 60,
        note: 'Decades into a debt super-cycle; high debt loads and the end of the disinflation tailwind define a late-stage backdrop.',
    },
];

export function positionCycles(cycles: CrashCycle[], now = new Date()): CrashCyclePosition[] {
    return cycles.map((c) => {
        const ageYears = (now.getTime() - new Date(c.anchorISO).getTime()) / (365.25 * 24 * 3600 * 1000);
        return {
            ...c,
            ageYears: Math.max(0, ageYears),
            progressPct: clamp((ageYears / c.lengthYears) * 100, 0, 100),
        };
    });
}

// ---------------------------------------------------------------------------
// Historical analogs
// ---------------------------------------------------------------------------

export const HISTORICAL_ANALOGS: HistoricalAnalog[] = [
    { year: '1929', name: 'Great Crash', drawdown: '−86%', trigger: 'Leverage unwind + policy error', setup: 'Margin-fueled mania, extreme valuations, weak banks', similarity: 38 },
    { year: '1973–74', name: 'Stagflation bear', drawdown: '−48%', trigger: 'Oil shock + inflation', setup: 'Nifty-Fifty concentration, rising rates', similarity: 44 },
    { year: '1987', name: 'Black Monday', drawdown: '−34%', trigger: 'Portfolio insurance / structure', setup: 'Fast run-up, rising yields, illiquid hedging', similarity: 41 },
    { year: '2000', name: 'Dot-com peak', drawdown: '−49%', trigger: 'Tech earnings disappointment', setup: 'Single-theme concentration, extreme multiples on a real technology', similarity: 62 },
    { year: '2008', name: 'Global Financial Crisis', drawdown: '−57%', trigger: 'Housing + credit / leverage', setup: 'Banking leverage, opaque credit, housing bubble', similarity: 33 },
    { year: '2020', name: 'COVID crash', drawdown: '−34%', trigger: 'Exogenous shock', setup: 'Full valuations meeting an unforecastable catalyst', similarity: 30 },
];

// ---------------------------------------------------------------------------
// Balanced narrative — both sides, always.
// ---------------------------------------------------------------------------

export const REASONS_NO_CRASH: string[] = [
    'Earnings are real. Unlike 1999, the mega-cap leaders generate enormous free cash flow and fund their own capex — the concentration rests on profits, not promises.',
    'No systemic banking fragility on the scale of 2008: large-bank capital and liquidity ratios are far higher and the worst private leverage sits in funds, not deposit-taking banks.',
    'Policy has room to ease. With rates well off zero, central banks can cut aggressively into weakness — the opposite of 1929 and 1937.',
    'Credit markets are calm. Tight high-yield spreads say lenders see low near-term default risk; crashes almost always have a credit warning first.',
    'Bull markets rarely die of old age or valuation alone — they need a catalyst (a shock, a policy error, a credit event). None is visibly imminent.',
    'Cash on the sidelines and under-positioned trend-followers can fuel further upside before any top.',
];

export const REASONS_UNDERESTIMATED: string[] = [
    'Concentration cuts both ways: the same handful of names that drove the index up can drag it down disproportionately if the AI capex cycle disappoints.',
    'Valuations set the starting point for 10-year returns. From today\'s multiples, the historical base rate for forward returns is low — and leaves little cushion for error.',
    'Yield-curve and credit signals lead price by 12–18 months; a benign tape today is fully consistent with stress brewing under the surface.',
    'Private-market marks are stale. A repricing of illiquid PE/VC/credit could transmit losses with a lag the public tape hasn\'t felt yet.',
    'Passive flows and vol-target strategies make the market reflexive — calm begets leverage, and a single shock can force synchronized de-grossing.',
    'The long-term debt cycle and record government leverage shrink the policy buffer relative to past rescues; the next backstop may be more inflationary than restorative.',
];

export const CRASH_SOURCES: Array<{ label: string; url: string }> = [
    { label: 'Robert Shiller — CAPE / Irrational Exuberance data', url: 'https://shillerdata.com/' },
    { label: 'Ray Dalio — How the Economic Machine Works / debt cycles', url: 'https://economicprinciples.org/' },
    { label: 'NY Fed — Yield-curve recession probability model', url: 'https://www.newyorkfed.org/research/capital_markets/ycfaq' },
    { label: 'FRED — yields, credit spreads, M2, debt/GDP', url: 'https://fred.stlouisfed.org/' },
    { label: 'Benner / Kondratieff / 18-year cycle literature', url: 'https://en.wikipedia.org/wiki/Benner_cycle' },
];

// ---------------------------------------------------------------------------
// Tone helpers (shared with the UI)
// ---------------------------------------------------------------------------

export const CLASS_TONE: Record<Classification, 'pos' | 'neutral' | 'neg' | 'crit'> = {
    bullish: 'pos',
    neutral: 'neutral',
    bearish: 'neg',
    extreme: 'crit',
};

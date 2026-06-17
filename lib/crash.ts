/**
 * Crash Detector — public type contract + presentational helpers.
 *
 * The scoring engine, instrument set, structural/cycle overlay and curated
 * framework now live in the PRIVATE markets-engine (reached over HTTP); this
 * file only declares the shape of the report the engine returns and the small,
 * display-only helpers the UI renders with. See lib/crash-scan.ts (proxy) and
 * lib/engine-client.ts.
 */

export type Classification = 'bullish' | 'neutral' | 'bearish' | 'extreme';
export type Provenance = 'live' | 'structural';

export interface CrashIndicator {
    key: string;
    label: string;
    group: 'Market' | 'Credit & Rates' | 'Speculation' | 'Cycle & Macro';
    provenance: Provenance;
    classification: Classification;
    weight: number;
    value: string | null;
    detail: string;
}

export interface CrashCycle {
    name: string;
    period: string;
    anchorISO: string;
    anchorLabel: string;
    lengthYears: number;
    note: string;
}

export interface CrashCyclePosition extends CrashCycle {
    ageYears: number;
    progressPct: number;
}

export interface HistoricalAnalog {
    year: string;
    name: string;
    drawdown: string;
    trigger: string;
    setup: string;
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

export interface CrashBand {
    label: string;
    tone: 'pos' | 'neutral' | 'warn' | 'neg' | 'crit';
    blurb: string;
}

export interface CrashSource {
    label: string;
    url: string;
}

export interface CrashReport {
    score: number;
    band: CrashBand;
    asOf: string;
    /** Most recent close date in the underlying live EOD data (YYYY-MM-DD). */
    dataDate: string;
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
    /** Curated reference links (served by the engine). */
    sources: CrashSource[];
}

// ---------------------------------------------------------------------------
// Presentational helpers (display-only — safe to live in the public app)
// ---------------------------------------------------------------------------

export const CLASS_LABEL: Record<Classification, string> = {
    bullish: 'Bullish',
    neutral: 'Neutral',
    bearish: 'Bearish',
    extreme: 'Extreme Risk',
};

export const CLASS_TONE: Record<Classification, 'pos' | 'neutral' | 'neg' | 'crit'> = {
    bullish: 'pos',
    neutral: 'neutral',
    bearish: 'neg',
    extreme: 'crit',
};

/** A small ± band around a probability to convey that these are estimates. */
export function probRange(p: number): string {
    const lo = Math.max(0, p - 6);
    const hi = Math.min(100, p + 8);
    return `${lo}–${hi}%`;
}

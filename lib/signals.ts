/**
 * Buy / Sell / Hold signals — public type contract + presentational helpers.
 *
 * The grading blend, instrument set, EOY projection and macro reads now run in
 * the PRIVATE markets-engine (reached over HTTP); this file only declares the
 * report shape the engine returns and the display-only grade metadata the UI
 * renders with. See lib/signals-scan.ts (proxy) and lib/engine-client.ts.
 */

export type Grade = 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';

export type SubState = 'bull' | 'neutral' | 'bear';
export type SignalTrend = 'improving' | 'weakening' | 'flat';

export interface SubSignal {
    label: string;
    state: SubState;
    detail: string;
}

/** End-of-year scenario band + a typical-correction downside with recovery time. */
export interface Projection {
    year: number;
    base: number; basePct: number;
    up: number; upPct: number;
    down: number; downPct: number;
    correction: number; correctionPct: number;
    recovery: string;
}

export interface IndexSignal {
    key: string;
    name: string;
    symbol: string;
    blurb: string;
    score: number;
    scorePrev: number | null;
    trend: SignalTrend;
    grade: Grade;
    last: number | null;
    dayChangePct: number | null;
    subs: SubSignal[];
    support: { level: number; label: string } | null;
    resistance: { level: number; label: string } | null;
    outlook: string;
    projection: Projection | null;
    limited: boolean;
}

export interface MacroRead {
    key: string;
    name: string;
    value: string;
    dayChange: string;
    dayUp: boolean;
    read: string;
    /** Tone = good / bad FOR STOCKS. */
    tone: 'pos' | 'neutral' | 'neg';
}

export interface MarketTone {
    label: string;
    tone: 'pos' | 'neutral' | 'neg';
    note: string;
}

// ---------------------------------------------------------------------------
// Presentational helper (display-only — safe to live in the public app)
// ---------------------------------------------------------------------------

export const GRADE_META: Record<Grade, { label: string; tone: 'pos' | 'pos2' | 'neutral' | 'neg' | 'neg2'; short: string }> = {
    'strong-buy': { label: 'Strong Buy', tone: 'pos2', short: 'SB' },
    buy: { label: 'Buy', tone: 'pos', short: 'B' },
    hold: { label: 'Hold', tone: 'neutral', short: 'H' },
    sell: { label: 'Sell', tone: 'neg', short: 'S' },
    'strong-sell': { label: 'Strong Sell', tone: 'neg2', short: 'SS' },
};

/**
 * Bubble Detector — public type contract + presentational helpers.
 *
 * The per-asset bubble/pop scoring and the curated theme / candidate /
 * historical catalogs now live in the PRIVATE markets-engine (reached over
 * HTTP); this file only declares the shapes the engine returns and the
 * display-only band/phase helpers the UI renders with. See lib/bubble-scan.ts
 * (proxy) and lib/engine-client.ts.
 */

export type Phase = 'calm' | 'inflating' | 'cracking' | 'popping';

export interface AssetBubble {
    symbol: string;
    last: number;
    ext200: number | null;
    ret1Y: number | null;
    ret3M: number | null;
    ret1M: number | null;
    offHigh: number | null;
    rsi: number | null;
    vol: number | null;
    limitedHistory: boolean;
    bubbleScore: number;
    popRisk: number;
    phase: Phase;
}

export interface BubbleTheme {
    id: string;
    label: string;
    tagline: string;
    why: string;
    symbols: string[];
    text: string;
    chip: string;
    bar: string;
}

export interface BubbleCandidate {
    id: string;
    label: string;
    tagline: string;
    thesis: string;
    watch: string;
    symbols: string[];
    text: string;
    chip: string;
    bar: string;
}

export interface HistoricalBubble {
    name: string;
    era: string;
    drawdown: string;
    drawdownPct: number;
    window: string;
    tell: string;
    lesson: string;
}

export interface BubbleSource {
    label: string;
    url: string;
}

// ---------------------------------------------------------------------------
// Presentational helpers (display-only — safe to live in the public app)
// ---------------------------------------------------------------------------

export function bubbleBand(score: number): { label: string; tone: 'pos' | 'warn' | 'neg' } {
    if (score >= 75) return { label: 'Bubble territory', tone: 'neg' };
    if (score >= 55) return { label: 'Frothy', tone: 'warn' };
    if (score >= 30) return { label: 'Elevated', tone: 'warn' };
    return { label: 'Calm', tone: 'pos' };
}

export const PHASE_LABEL: Record<Phase, string> = {
    calm: 'No bubble',
    inflating: 'Inflating',
    cracking: 'Cracking',
    popping: 'Deflating',
};

export const PHASE_TONE: Record<Phase, 'pos' | 'warn' | 'neg'> = {
    calm: 'pos',
    inflating: 'neg',
    cracking: 'warn',
    popping: 'warn',
};

/**
 * Buy / Sell / Hold signal engine for the major US indices.
 *
 * Power-user feature. Each index gets a graded recommendation (Strong Sell →
 * Strong Buy) from a transparent blend of real end-of-day technicals — primary
 * and short-term trend, the 50/200 structure, RSI momentum, multi-window
 * returns and position vs the 52-week high — plus key support/resistance levels
 * and a plain-language "what I'd expect next session" read off the last close.
 *
 * Educational/heuristic, not investment advice. Signals are derived from EOD
 * data (as current as the free feed allows), so they update once per session.
 */

import {
    clamp,
    smaOf,
    rsiOf,
    retOf,
    extOf,
    offHighOf,
    lastOf,
} from '@/lib/crash';

export type Grade = 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';

export interface IndexDef {
    key: string;
    name: string;
    /** Yahoo index symbol. */
    symbol: string;
    blurb: string;
}

/** The four indices the page covers — real index symbols (Yahoo EOD). */
export const SIGNAL_INDICES: IndexDef[] = [
    { key: 'spx', name: 'S&P 500', symbol: '^GSPC', blurb: '500 US large-caps — the broad market' },
    { key: 'ndx', name: 'Nasdaq', symbol: '^IXIC', blurb: 'Nasdaq Composite — tech & growth heavy' },
    { key: 'rut', name: 'Russell 2000', symbol: '^RUT', blurb: 'US small-caps — risk-appetite gauge' },
    { key: 'dji', name: 'Dow Jones', symbol: '^DJI', blurb: '30 blue-chip industrials — old-economy' },
];

export type SubState = 'bull' | 'neutral' | 'bear';

export interface SubSignal {
    label: string;
    state: SubState;
    detail: string;
}

export interface IndexSignal {
    key: string;
    name: string;
    symbol: string;
    blurb: string;
    /** 0–100 composite (50 = neutral). */
    score: number;
    grade: Grade;
    last: number | null;
    dayChangePct: number | null;
    subs: SubSignal[];
    /** Nearest support / resistance with labels. */
    support: { level: number; label: string } | null;
    resistance: { level: number; label: string } | null;
    /** Forward, "if it closes here, next session" read. */
    outlook: string;
    limited: boolean;
}

export const GRADE_META: Record<Grade, { label: string; tone: 'pos' | 'pos2' | 'neutral' | 'neg' | 'neg2'; short: string }> = {
    'strong-buy': { label: 'Strong Buy', tone: 'pos2', short: 'SB' },
    buy: { label: 'Buy', tone: 'pos', short: 'B' },
    hold: { label: 'Hold', tone: 'neutral', short: 'H' },
    sell: { label: 'Sell', tone: 'neg', short: 'S' },
    'strong-sell': { label: 'Strong Sell', tone: 'neg2', short: 'SS' },
};

export function gradeFor(score: number): Grade {
    if (score >= 72) return 'strong-buy';
    if (score >= 60) return 'buy';
    if (score >= 45) return 'hold';
    if (score >= 33) return 'sell';
    return 'strong-sell';
}

const fmtPct = (v: number | null, d = 1) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}%`);
const fmtNum = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 0 : 2 });

/**
 * Compute the full signal for one index from its daily-close series.
 * Returns null when there isn't enough history.
 */
export function computeIndexSignal(def: IndexDef, closes: number[]): IndexSignal | null {
    const n = closes.length;
    if (n < 60) return null;

    const last = lastOf(closes)!;
    const prev = closes[n - 2];
    const dayChangePct = prev > 0 ? (last / prev - 1) * 100 : null;

    const sma50 = smaOf(closes, 50);
    const sma200 = smaOf(closes, 200);
    const ext200 = extOf(closes, 200);
    const rsi = rsiOf(closes);
    const ret1w = retOf(closes, 5);
    const ret1m = retOf(closes, 21);
    const ret3m = retOf(closes, 63);
    const offHigh = offHighOf(closes);
    const limited = n < 252;

    // --- Composite score (start neutral at 50) ---
    let s = 50;
    const subs: SubSignal[] = [];

    // Primary trend vs 200-day
    if (sma200 != null) {
        const above = last > sma200;
        s += above ? 13 : -13;
        subs.push({
            label: 'Primary trend (200-day)',
            state: above ? 'bull' : 'bear',
            detail: `Price ${fmtPct(ext200)} ${above ? 'above' : 'below'} the 200-day (${fmtNum(sma200)}). ${above ? 'Long-term uptrend intact.' : 'Long-term trend is down.'}`,
        });
    }

    // Short-term trend vs 50-day
    if (sma50 != null) {
        const above = last > sma50;
        s += above ? 8 : -8;
        subs.push({
            label: 'Short-term trend (50-day)',
            state: above ? 'bull' : 'bear',
            detail: `Price is ${above ? 'above' : 'below'} the 50-day (${fmtNum(sma50)}) — ${above ? 'near-term momentum is positive' : 'near-term momentum has rolled over'}.`,
        });
    }

    // 50/200 structure
    if (sma50 != null && sma200 != null) {
        const golden = sma50 >= sma200;
        s += golden ? 6 : -6;
        subs.push({
            label: 'Trend structure (50/200)',
            state: golden ? 'bull' : 'bear',
            detail: golden ? 'Golden-cross alignment — 50-day above the 200-day.' : 'Death-cross alignment — 50-day below the 200-day.',
        });
    }

    // RSI momentum (healthy 55–70 best; overbought >78 fades; oversold <30 bounce)
    if (rsi != null) {
        let rsiScore = clamp((rsi - 50) * 0.6, -15, 12);
        let state: SubState = rsi >= 55 ? 'bull' : rsi <= 45 ? 'bear' : 'neutral';
        let note: string;
        if (rsi > 78) { rsiScore -= 6; state = 'neutral'; note = 'Overbought — momentum strong but stretched; pullback risk rises.'; }
        else if (rsi >= 55) note = 'Healthy momentum.';
        else if (rsi < 30) { rsiScore += 5; state = 'neutral'; note = 'Oversold — washed out; prone to a bounce.'; }
        else if (rsi <= 45) note = 'Weak momentum.';
        else note = 'Neutral momentum.';
        s += rsiScore;
        subs.push({ label: 'Momentum (RSI-14)', state, detail: `RSI ${rsi.toFixed(0)}. ${note}` });
    }

    // 1-month return
    if (ret1m != null) {
        s += clamp(ret1m, -10, 10) * 0.8;
        subs.push({
            label: '1-month return',
            state: ret1m > 1 ? 'bull' : ret1m < -1 ? 'bear' : 'neutral',
            detail: `${fmtPct(ret1m)} over the last month.`,
        });
    }

    // 3-month return
    if (ret3m != null) {
        s += clamp(ret3m, -15, 15) * 0.4;
    }

    // 1-week return (short-term tape)
    if (ret1w != null) {
        s += clamp(ret1w, -6, 6) * 0.6;
    }

    // Position vs 52-week high
    if (offHigh != null) {
        let state: SubState;
        if (offHigh > -2) { s += 5; state = 'bull'; }
        else if (offHigh > -10) { s += 1; state = 'neutral'; }
        else if (offHigh > -20) { s -= 6; state = 'bear'; }
        else { s -= 11; state = 'bear'; }
        subs.push({
            label: 'Position vs 52-week high',
            state,
            detail: `${fmtPct(offHigh)} from the 52-week high. ${offHigh > -2 ? 'Pressing the highs — strongest tape.' : offHigh > -10 ? 'Just off the highs.' : 'Well off the highs — repair needed.'}`,
        });
    }

    // Over-extension penalty (mean-reversion risk far above trend)
    if (ext200 != null && ext200 > 15) s -= 4;

    const score = Math.round(clamp(s, 0, 100));
    const grade = gradeFor(score);

    // --- Support / resistance from the structure ---
    const win20 = closes.slice(-20);
    const recentHigh = Math.max(...win20);
    const recentLow = Math.min(...win20);
    const high52 = Math.max(...closes.slice(-252));

    const supportCandidates = [
        sma50 != null && sma50 < last ? { level: sma50, label: '50-day average' } : null,
        sma200 != null && sma200 < last ? { level: sma200, label: '200-day average' } : null,
        recentLow < last ? { level: recentLow, label: '20-day low' } : null,
    ].filter((x): x is { level: number; label: string } => x != null);
    // Nearest support = the highest level still below price.
    const support = supportCandidates.length
        ? supportCandidates.reduce((a, b) => (b.level > a.level ? b : a))
        : null;

    const resistanceCandidates = [
        recentHigh > last ? { level: recentHigh, label: '20-day high' } : null,
        high52 > last ? { level: high52, label: '52-week high' } : null,
    ].filter((x): x is { level: number; label: string } => x != null);
    const resistance = resistanceCandidates.length
        ? resistanceCandidates.reduce((a, b) => (b.level < a.level ? b : a))
        : null;

    const outlook = buildOutlook({ name: def.name, last, dayChangePct, grade, support, resistance, rsi, offHigh });

    return {
        key: def.key,
        name: def.name,
        symbol: def.symbol,
        blurb: def.blurb,
        score,
        grade,
        last,
        dayChangePct,
        subs,
        support,
        resistance,
        outlook,
        limited,
    };
}

function buildOutlook(p: {
    name: string;
    last: number;
    dayChangePct: number | null;
    grade: Grade;
    support: { level: number; label: string } | null;
    resistance: { level: number; label: string } | null;
    rsi: number | null;
    offHigh: number | null;
}): string {
    const lvl = (v: number) => fmtNum(v);
    const lean =
        p.grade === 'strong-buy' || p.grade === 'buy'
            ? 'I lean constructive into the next session'
            : p.grade === 'hold'
              ? 'I stay neutral into the next session'
              : 'I lean cautious into the next session';

    const sup = p.support ? `holds above ${lvl(p.support.level)} (${p.support.label})` : 'holds its footing';
    const res = p.resistance ? `a close back above ${lvl(p.resistance.level)} (${p.resistance.label}) opens more upside` : 'it is in open air at new highs, where there is no overhead resistance';
    const breakNote = p.support
        ? `Lose ${lvl(p.support.level)} on a daily close and the next session likely tests lower.`
        : 'A failure to hold here would turn the near-term tape lower.';

    const rsiNote =
        p.rsi != null && p.rsi > 78
            ? ' Momentum is overbought, so chase moves carefully — a pause or shakeout would be normal.'
            : p.rsi != null && p.rsi < 30
              ? ' Momentum is oversold, so a relief bounce is the higher-odds near-term move.'
              : '';

    return `If ${p.name} closes near ${lvl(p.last)} (${fmtPct(p.dayChangePct)} on the day), ${lean}: so long as it ${sup}, ${res}. ${breakNote}${rsiNote}`;
}

/** Overall market read from the four grades — for the page header. */
export function marketTone(signals: IndexSignal[]): { label: string; tone: 'pos' | 'neutral' | 'neg'; note: string } {
    if (signals.length === 0) return { label: 'No data', tone: 'neutral', note: 'Signals are unavailable right now.' };
    const avg = signals.reduce((a, b) => a + b.score, 0) / signals.length;
    const bullish = signals.filter((s) => s.score >= 60).length;
    const bearish = signals.filter((s) => s.score < 45).length;
    if (avg >= 60) return { label: 'Risk-On', tone: 'pos', note: `${bullish}/${signals.length} indices on a buy signal — broad uptrend.` };
    if (avg < 45) return { label: 'Risk-Off', tone: 'neg', note: `${bearish}/${signals.length} indices on a sell signal — defense warranted.` };
    return { label: 'Mixed / Neutral', tone: 'neutral', note: 'Signals are split — a stock-picker\'s tape rather than a clear index trend.' };
}

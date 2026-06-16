/**
 * Buy / Sell / Hold signal engine for the major US indices, sectors and the
 * macro backdrop.
 *
 * Power-user feature. Each instrument gets a graded recommendation (Strong Sell
 * → Strong Buy) from a transparent blend of real end-of-day technicals — primary
 * and short-term trend, the 50/200 structure, RSI momentum, multi-window returns
 * and position vs the 52-week high — plus key support/resistance levels, a
 * week-over-week signal trend, and a plain-language "what I'd expect next
 * session" read off the last close. The macro strip (VIX, 10-year yield, dollar,
 * gold) frames the risk environment around the index calls.
 *
 * Educational/heuristic, not investment advice. Derived from EOD data (as
 * current as the free feed allows), so it updates once per session.
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
import { recoveryForDrawdown } from '@/lib/market-history';

export type Grade = 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';

/** Long-run nominal annual drift assumptions used for the EOY projection. */
const EOY_DRIFT: Record<string, number> = { spx: 0.08, ndx: 0.11, rut: 0.09, dji: 0.07 };

export interface IndexDef {
    key: string;
    name: string;
    /** Yahoo symbol. */
    symbol: string;
    blurb: string;
}

/** The four headline indices — real index symbols (Yahoo EOD). */
export const SIGNAL_INDICES: IndexDef[] = [
    { key: 'spx', name: 'S&P 500', symbol: '^GSPC', blurb: '500 US large-caps — the broad market' },
    { key: 'ndx', name: 'Nasdaq', symbol: '^IXIC', blurb: 'Nasdaq Composite — tech & growth heavy' },
    { key: 'rut', name: 'Russell 2000', symbol: '^RUT', blurb: 'US small-caps — risk-appetite gauge' },
    { key: 'dji', name: 'Dow Jones', symbol: '^DJI', blurb: '30 blue-chip industrials — old-economy' },
];

/** The 11 SPDR sector ETFs — same grading engine, compact board. */
export const SECTOR_ETFS: IndexDef[] = [
    { key: 'xlk', name: 'Technology', symbol: 'XLK', blurb: 'Tech' },
    { key: 'xlc', name: 'Communication', symbol: 'XLC', blurb: 'Comm services' },
    { key: 'xly', name: 'Cons. Discretionary', symbol: 'XLY', blurb: 'Discretionary' },
    { key: 'xlf', name: 'Financials', symbol: 'XLF', blurb: 'Financials' },
    { key: 'xlv', name: 'Health Care', symbol: 'XLV', blurb: 'Healthcare' },
    { key: 'xli', name: 'Industrials', symbol: 'XLI', blurb: 'Industrials' },
    { key: 'xle', name: 'Energy', symbol: 'XLE', blurb: 'Energy' },
    { key: 'xlp', name: 'Cons. Staples', symbol: 'XLP', blurb: 'Staples' },
    { key: 'xlb', name: 'Materials', symbol: 'XLB', blurb: 'Materials' },
    { key: 'xlu', name: 'Utilities', symbol: 'XLU', blurb: 'Utilities' },
    { key: 'xlre', name: 'Real Estate', symbol: 'XLRE', blurb: 'REITs' },
];

/** Macro backdrop series — frames the risk environment for stocks. */
export interface MacroDef {
    key: string;
    name: string;
    symbol: string;
    unit: 'index' | 'yield' | 'price';
}
export const MACRO_SERIES: MacroDef[] = [
    { key: 'vix', name: 'Volatility · VIX', symbol: '^VIX', unit: 'index' },
    { key: 'ust10', name: 'US 10-Year Yield', symbol: '^TNX', unit: 'yield' },
    { key: 'dxy', name: 'US Dollar · DXY', symbol: 'DX-Y.NYB', unit: 'index' },
    { key: 'gold', name: 'Gold', symbol: 'GLD', unit: 'price' },
];

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
    /** Typical-correction scenario level (independent of the EOY band). */
    correction: number; correctionPct: number;
    /** Historical time to recover that correction. */
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
 * The 0–100 composite score for a daily-close series (50 = neutral). Pure, so it
 * can be re-run on a truncated series to measure the week-over-week trend.
 */
export function scoreCloses(closes: number[]): number | null {
    const n = closes.length;
    if (n < 60) return null;
    const last = lastOf(closes)!;
    const sma50 = smaOf(closes, 50);
    const sma200 = smaOf(closes, 200);
    const ext200 = extOf(closes, 200);
    const rsi = rsiOf(closes);
    const ret1w = retOf(closes, 5);
    const ret1m = retOf(closes, 21);
    const ret3m = retOf(closes, 63);
    const offHigh = offHighOf(closes);

    let s = 50;
    if (sma200 != null) s += last > sma200 ? 13 : -13;
    if (sma50 != null) s += last > sma50 ? 8 : -8;
    if (sma50 != null && sma200 != null) s += sma50 >= sma200 ? 6 : -6;
    if (rsi != null) {
        let r = clamp((rsi - 50) * 0.6, -15, 12);
        if (rsi > 78) r -= 6;
        else if (rsi < 30) r += 5;
        s += r;
    }
    if (ret1m != null) s += clamp(ret1m, -10, 10) * 0.8;
    if (ret3m != null) s += clamp(ret3m, -15, 15) * 0.4;
    if (ret1w != null) s += clamp(ret1w, -6, 6) * 0.6;
    if (offHigh != null) {
        if (offHigh > -2) s += 5;
        else if (offHigh > -10) s += 1;
        else if (offHigh > -20) s -= 6;
        else s -= 11;
    }
    if (ext200 != null && ext200 > 15) s -= 4;
    return Math.round(clamp(s, 0, 100));
}

/**
 * End-of-year projection: a ±1-sigma band around a long-run drift path for the
 * remaining year, plus a typical-correction downside with its historical
 * recovery time. Annualized vol from the last ~60 daily returns; clearly a
 * probabilistic scenario, not a prediction.
 */
export function computeProjection(key: string, closes: number[]): Projection | null {
    const n = closes.length;
    if (n < 40) return null;
    const last = lastOf(closes)!;
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearEndMs = Date.UTC(year, 11, 31);
    const f = clamp((yearEndMs - now.getTime()) / (365.25 * 24 * 3600 * 1000), 0.04, 1);

    const rets: number[] = [];
    for (let i = Math.max(1, n - 60); i < n; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
    const annVol = Math.sqrt(variance) * Math.sqrt(252);
    const horizonVol = annVol * Math.sqrt(f);

    const drift = (EOY_DRIFT[key] ?? 0.08) * f;
    const base = last * (1 + drift);
    const up = last * (1 + drift + horizonVol);
    const down = last * (1 + drift - horizonVol);

    const correctionPct = -clamp(Math.max(0.1, horizonVol * 1.5), 0.1, 0.2);
    const correction = last * (1 + correctionPct);

    return {
        year,
        base, basePct: (base / last - 1) * 100,
        up, upPct: (up / last - 1) * 100,
        down, downPct: (down / last - 1) * 100,
        correction, correctionPct: correctionPct * 100,
        recovery: recoveryForDrawdown(correctionPct * 100),
    };
}

/** Full signal for one instrument from its daily-close series. */
export function computeIndexSignal(def: IndexDef, closes: number[]): IndexSignal | null {
    const n = closes.length;
    if (n < 60) return null;

    const score = scoreCloses(closes);
    if (score == null) return null;
    const scorePrev = scoreCloses(closes.slice(0, n - 5));
    const delta = scorePrev != null ? score - scorePrev : 0;
    const trend: SignalTrend = delta >= 3 ? 'improving' : delta <= -3 ? 'weakening' : 'flat';

    const last = lastOf(closes)!;
    const prev = closes[n - 2];
    const dayChangePct = prev > 0 ? (last / prev - 1) * 100 : null;

    const sma50 = smaOf(closes, 50);
    const sma200 = smaOf(closes, 200);
    const ext200 = extOf(closes, 200);
    const rsi = rsiOf(closes);
    const ret1m = retOf(closes, 21);
    const offHigh = offHighOf(closes);
    const limited = n < 252;

    const subs: SubSignal[] = [];
    if (sma200 != null) {
        const above = last > sma200;
        subs.push({ label: 'Primary trend (200-day)', state: above ? 'bull' : 'bear', detail: `Price ${fmtPct(ext200)} ${above ? 'above' : 'below'} the 200-day (${fmtNum(sma200)}). ${above ? 'Long-term uptrend intact.' : 'Long-term trend is down.'}` });
    }
    if (sma50 != null) {
        const above = last > sma50;
        subs.push({ label: 'Short-term trend (50-day)', state: above ? 'bull' : 'bear', detail: `Price is ${above ? 'above' : 'below'} the 50-day (${fmtNum(sma50)}) — ${above ? 'near-term momentum is positive' : 'near-term momentum has rolled over'}.` });
    }
    if (sma50 != null && sma200 != null) {
        const golden = sma50 >= sma200;
        subs.push({ label: 'Trend structure (50/200)', state: golden ? 'bull' : 'bear', detail: golden ? 'Golden-cross alignment — 50-day above the 200-day.' : 'Death-cross alignment — 50-day below the 200-day.' });
    }
    if (rsi != null) {
        let state: SubState = rsi >= 55 ? 'bull' : rsi <= 45 ? 'bear' : 'neutral';
        let note: string;
        if (rsi > 78) { state = 'neutral'; note = 'Overbought — strong but stretched; pullback risk rises.'; }
        else if (rsi >= 55) note = 'Healthy momentum.';
        else if (rsi < 30) { state = 'neutral'; note = 'Oversold — washed out; prone to a bounce.'; }
        else if (rsi <= 45) note = 'Weak momentum.';
        else note = 'Neutral momentum.';
        subs.push({ label: 'Momentum (RSI-14)', state, detail: `RSI ${rsi.toFixed(0)}. ${note}` });
    }
    if (ret1m != null) {
        subs.push({ label: '1-month return', state: ret1m > 1 ? 'bull' : ret1m < -1 ? 'bear' : 'neutral', detail: `${fmtPct(ret1m)} over the last month.` });
    }
    if (offHigh != null) {
        const state: SubState = offHigh > -2 ? 'bull' : offHigh > -10 ? 'neutral' : 'bear';
        subs.push({ label: 'Position vs 52-week high', state, detail: `${fmtPct(offHigh)} from the 52-week high. ${offHigh > -2 ? 'Pressing the highs — strongest tape.' : offHigh > -10 ? 'Just off the highs.' : 'Well off the highs — repair needed.'}` });
    }

    const grade = gradeFor(score);

    // Support / resistance from the structure.
    const win20 = closes.slice(-20);
    const recentHigh = Math.max(...win20);
    const recentLow = Math.min(...win20);
    const high52 = Math.max(...closes.slice(-252));
    const supportCandidates = [
        sma50 != null && sma50 < last ? { level: sma50, label: '50-day average' } : null,
        sma200 != null && sma200 < last ? { level: sma200, label: '200-day average' } : null,
        recentLow < last ? { level: recentLow, label: '20-day low' } : null,
    ].filter((x): x is { level: number; label: string } => x != null);
    const support = supportCandidates.length ? supportCandidates.reduce((a, b) => (b.level > a.level ? b : a)) : null;
    const resistanceCandidates = [
        recentHigh > last ? { level: recentHigh, label: '20-day high' } : null,
        high52 > last ? { level: high52, label: '52-week high' } : null,
    ].filter((x): x is { level: number; label: string } => x != null);
    const resistance = resistanceCandidates.length ? resistanceCandidates.reduce((a, b) => (b.level < a.level ? b : a)) : null;

    const outlook = buildOutlook({ name: def.name, last, dayChangePct, grade, support, resistance, rsi, offHigh });
    const projection = computeProjection(def.key, closes);

    return { key: def.key, name: def.name, symbol: def.symbol, blurb: def.blurb, score, scorePrev, trend, grade, last, dayChangePct, subs, support, resistance, outlook, projection, limited };
}

function buildOutlook(p: {
    name: string; last: number; dayChangePct: number | null; grade: Grade;
    support: { level: number; label: string } | null; resistance: { level: number; label: string } | null;
    rsi: number | null; offHigh: number | null;
}): string {
    const lvl = (v: number) => fmtNum(v);
    const lean = p.grade === 'strong-buy' || p.grade === 'buy' ? 'I lean constructive into the next session'
        : p.grade === 'hold' ? 'I stay neutral into the next session' : 'I lean cautious into the next session';
    const sup = p.support ? `holds above ${lvl(p.support.level)} (${p.support.label})` : 'holds its footing';
    const res = p.resistance ? `a close back above ${lvl(p.resistance.level)} (${p.resistance.label}) opens more upside` : 'it is in open air at new highs, where there is no overhead resistance';
    const breakNote = p.support ? `Lose ${lvl(p.support.level)} on a daily close and the next session likely tests lower.` : 'A failure to hold here would turn the near-term tape lower.';
    const rsiNote = p.rsi != null && p.rsi > 78 ? ' Momentum is overbought, so chase moves carefully — a pause or shakeout would be normal.'
        : p.rsi != null && p.rsi < 30 ? ' Momentum is oversold, so a relief bounce is the higher-odds near-term move.' : '';
    return `If ${p.name} closes near ${lvl(p.last)} (${fmtPct(p.dayChangePct)} on the day), ${lean}: so long as it ${sup}, ${res}. ${breakNote}${rsiNote}`;
}

/** Macro backdrop read for one series — framed as good/bad FOR STOCKS. */
export function computeMacro(def: MacroDef, closes: number[]): MacroRead | null {
    const n = closes.length;
    if (n < 25) return null;
    const last = lastOf(closes)!;
    const prev = closes[n - 2];
    const monthAgo = closes[n - 1 - 21] ?? closes[0];

    let value: string;
    let dayChange: string;
    let read: string;
    let tone: 'pos' | 'neutral' | 'neg';
    const dayUp = last >= prev;

    if (def.unit === 'yield') {
        const y = last / 10; // ^TNX is yield ×10
        const yPrev = prev / 10;
        const yMonth = monthAgo / 10;
        value = `${y.toFixed(2)}%`;
        dayChange = `${last - prev >= 0 ? '+' : ''}${Math.round((y - yPrev) * 100)} bps`;
        const m = y - yMonth;
        if (m > 0.3) { tone = 'neg'; read = `Yields up ~${Math.round(m * 100)}bps in a month — a headwind for equities, especially long-duration growth.`; }
        else if (m < -0.3) { tone = 'pos'; read = `Yields down ~${Math.round(-m * 100)}bps in a month — a tailwind for stocks and rate-sensitive sectors.`; }
        else { tone = 'neutral'; read = 'Yields roughly stable — neutral for equities.'; }
    } else if (def.unit === 'index' && def.key === 'vix') {
        value = last.toFixed(1);
        dayChange = `${fmtPct(prev > 0 ? (last / prev - 1) * 100 : null)}`;
        if (last < 16) { tone = 'pos'; read = 'Calm volatility — supportive of risk, though very low VIX can signal complacency.'; }
        else if (last < 22) { tone = 'neutral'; read = 'Normal volatility — no stress signal.'; }
        else if (last < 30) { tone = 'neg'; read = 'Elevated volatility — the market is pricing real stress; headwind for risk.'; }
        else { tone = 'neg'; read = 'Volatility spiking — a stress event; defense warranted.'; }
    } else if (def.key === 'dxy') {
        value = last.toFixed(1);
        dayChange = `${fmtPct(prev > 0 ? (last / prev - 1) * 100 : null)}`;
        const m = monthAgo > 0 ? (last / monthAgo - 1) * 100 : 0;
        if (m > 2) { tone = 'neg'; read = `Dollar up ${fmtPct(m)} in a month — tighter global liquidity, a headwind for multinationals and EM.`; }
        else if (m < -2) { tone = 'pos'; read = `Dollar down ${fmtPct(m)} in a month — easier liquidity, a tailwind for risk and large-cap earnings.`; }
        else { tone = 'neutral'; read = 'Dollar roughly stable — neutral for equities.'; }
    } else {
        // gold
        value = `$${last.toFixed(0)}`;
        dayChange = `${fmtPct(prev > 0 ? (last / prev - 1) * 100 : null)}`;
        const m = monthAgo > 0 ? (last / monthAgo - 1) * 100 : 0;
        if (m > 5) { tone = 'neutral'; read = `Gold up ${fmtPct(m)} in a month — strong safe-haven/debasement demand; watch for risk-off rotation.`; }
        else if (m < -5) { tone = 'neutral'; read = `Gold down ${fmtPct(m)} in a month — risk appetite firm, less defensive demand.`; }
        else { tone = 'neutral'; read = 'Gold roughly stable — no strong haven signal.'; }
    }

    return { key: def.key, name: def.name, value, dayChange, dayUp, read, tone };
}

/** Overall market read from the index grades — for the page header. */
export function marketTone(signals: IndexSignal[]): { label: string; tone: 'pos' | 'neutral' | 'neg'; note: string } {
    if (signals.length === 0) return { label: 'No data', tone: 'neutral', note: 'Signals are unavailable right now.' };
    const avg = signals.reduce((a, b) => a + b.score, 0) / signals.length;
    const bullish = signals.filter((s) => s.score >= 60).length;
    const bearish = signals.filter((s) => s.score < 45).length;
    if (avg >= 60) return { label: 'Risk-On', tone: 'pos', note: `${bullish}/${signals.length} indices on a buy signal — broad uptrend.` };
    if (avg < 45) return { label: 'Risk-Off', tone: 'neg', note: `${bearish}/${signals.length} indices on a sell signal — defense warranted.` };
    return { label: 'Mixed / Neutral', tone: 'neutral', note: 'Signals are split — a stock-picker\'s tape rather than a clear index trend.' };
}

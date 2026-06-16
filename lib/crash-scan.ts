'use server';

/**
 * Server orchestration for the Crash Detector. Pulls EOD series for a small set
 * of macro proxies (broad market, vol, the curve, credit, gold, sectors and a
 * speculative-froth basket — each KV-cached 6h via fetchDailyCloses), turns
 * them into classified LIVE indicators, folds in the STRUCTURAL/cycle overlay,
 * and assembles the full committee report. Degrades gracefully: any series that
 * fails to load simply drops out of the composite.
 */

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import {
    ALL_CRASH_SYMBOLS,
    CRASH_SYMBOLS,
    STRUCTURAL_INDICATORS,
    CRASH_CYCLES,
    HISTORICAL_ANALOGS,
    REASONS_NO_CRASH,
    REASONS_UNDERESTIMATED,
    compositeScore,
    crashBand,
    scoreToProbabilities,
    positionCycles,
    extOf,
    retOf,
    rsiOf,
    offHighOf,
    lastOf,
    type CrashIndicator,
    type Classification,
    type CrashReport,
    type HistoricalAnalog,
} from '@/lib/crash';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

async function fetchSeries(symbols: string[]): Promise<{ closes: Map<string, number[]>; dataDate: string }> {
    const closes = new Map<string, number[]>();
    let dataDate = '';
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            try {
                const series = await fetchDailyCloses(sym);
                if (series.length > 0) {
                    closes.set(sym, series.map((c) => c.close));
                    const d = series[series.length - 1].date;
                    if (d > dataDate) dataDate = d;
                }
            } catch {
                /* one bad symbol shouldn't sink the scan */
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return { closes, dataDate };
}

const fmtPct = (v: number | null, d = 1) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}%`);

/** Build the live indicators from the fetched series. Each returns null if its inputs are missing. */
function buildLiveIndicators(data: Map<string, number[]>): CrashIndicator[] {
    const out: CrashIndicator[] = [];
    const S = CRASH_SYMBOLS;

    // 1. Equity trend & momentum (SPY vs 200d, 1y, RSI)
    const spy = data.get(S.spx);
    if (spy && spy.length > 60) {
        const ext = extOf(spy, 200);
        const r1y = retOf(spy, 252);
        const rsi = rsiOf(spy);
        // Healthy uptrend = low crash risk; break of trend = risk.
        let cls: Classification;
        if (ext != null && ext > 2 && (r1y ?? 0) > 0) cls = 'bullish';
        else if (ext != null && ext > -1) cls = 'neutral';
        else if (ext != null && ext > -8) cls = 'bearish';
        else cls = 'extreme';
        out.push({
            key: 'equity-trend', label: 'Equity trend & momentum', group: 'Market', provenance: 'live',
            classification: cls, weight: 0.9, value: `S&P ${fmtPct(ext)} vs 200d`,
            detail: `S&P 500 sits ${fmtPct(ext)} from its 200-day average, ${fmtPct(r1y)} over the past year, RSI ${rsi != null ? rsi.toFixed(0) : '—'}. ${cls === 'bullish' ? 'Primary uptrend intact.' : cls === 'neutral' ? 'Trend flattening.' : 'Trend broken — momentum has turned down.'}`,
        });
    }

    // 2. Market breadth (% of sector ETFs above their 200d)
    const sectorExts = S.sectors
        .map((s) => data.get(s))
        .filter((c): c is number[] => Boolean(c && c.length > 200))
        .map((c) => extOf(c, 200))
        .filter((e): e is number => e != null);
    if (sectorExts.length >= 6) {
        const above = sectorExts.filter((e) => e > 0).length;
        const pct = (above / sectorExts.length) * 100;
        // High breadth = healthy; narrow = risk. (Invert the threshold sense.)
        const cls: Classification = pct >= 70 ? 'bullish' : pct >= 45 ? 'neutral' : pct >= 25 ? 'bearish' : 'extreme';
        out.push({
            key: 'breadth', label: 'Market breadth', group: 'Market', provenance: 'live',
            classification: cls, weight: 1.0, value: `${above}/${sectorExts.length} sectors > 200d`,
            detail: `${Math.round(pct)}% of major sectors trade above their 200-day average. ${cls === 'bullish' ? 'Broad participation — a durable advance.' : cls === 'extreme' ? 'Very narrow — the index is being held up by a handful of names.' : 'Participation is thinning beneath the surface.'}`,
        });
    }

    // 3. Volatility regime (^VIX level)
    const vix = data.get(S.vix);
    const vixLast = vix ? lastOf(vix) : null;
    if (vixLast != null) {
        const cls: Classification = vixLast < 15 ? 'bullish' : vixLast < 22 ? 'neutral' : vixLast < 30 ? 'bearish' : 'extreme';
        out.push({
            key: 'volatility', label: 'Volatility regime (VIX)', group: 'Market', provenance: 'live',
            classification: cls, weight: 0.8, value: `VIX ${vixLast.toFixed(1)}`,
            detail: `The VIX is at ${vixLast.toFixed(1)}. ${cls === 'bullish' ? 'Calm — though very low vol can mask building complacency.' : cls === 'neutral' ? 'Normal range.' : cls === 'bearish' ? 'Elevated — the market is pricing real stress.' : 'Spiking — a stress event is underway.'}`,
        });
    }

    // 4. Yield curve (10y − 3m), the classic recession lead
    const tnx = data.get(S.tenYear);
    const irx = data.get(S.threeMonth);
    const tenY = tnx ? lastOf(tnx) : null;
    const threeM = irx ? lastOf(irx) : null;
    if (tenY != null && threeM != null) {
        const spread = tenY / 10 - threeM; // ^TNX is yield ×10
        // Inverted (negative) = extreme recession signal; steep = healthy.
        const cls: Classification = spread > 1.0 ? 'bullish' : spread > 0.25 ? 'neutral' : spread > -0.1 ? 'bearish' : 'extreme';
        out.push({
            key: 'yield-curve', label: 'Yield curve (10y − 3m)', group: 'Credit & Rates', provenance: 'live',
            classification: cls, weight: 1.4, value: `${spread > 0 ? '+' : ''}${spread.toFixed(2)}%`,
            detail: `The 10-year minus 3-month spread is ${spread > 0 ? '+' : ''}${spread.toFixed(2)}%. ${cls === 'extreme' ? 'Inverted — the single best-known recession lead indicator is flashing; recessions historically follow 12–18 months after it re-steepens.' : cls === 'bearish' ? 'Flat — the curve has lost its growth signal.' : 'Positively sloped — no recession signal here.'}`,
        });
    }

    // 5. Credit spreads (HY vs IG, 3-month relative)
    const hy = data.get(S.hy);
    const ig = data.get(S.ig);
    if (hy && ig && hy.length > 70 && ig.length > 70) {
        const hyR = retOf(hy, 63) ?? 0;
        const igR = retOf(ig, 63) ?? 0;
        const rel = hyR - igR; // HY underperforming IG → spreads widening → stress
        // rel positive (HY winning) = calm; very negative = stress.
        const cls: Classification = rel > 1 ? 'bullish' : rel > -1 ? 'neutral' : rel > -4 ? 'bearish' : 'extreme';
        out.push({
            key: 'credit-spreads', label: 'Credit spreads (HY vs IG)', group: 'Credit & Rates', provenance: 'live',
            classification: cls, weight: 1.3, value: `${fmtPct(rel)} 3m HY−IG`,
            detail: `High-yield credit has performed ${fmtPct(rel)} vs investment-grade over 3 months. ${cls === 'bullish' || cls === 'neutral' ? 'Spreads tight/stable — lenders see low default risk, and crashes almost always show a credit warning first.' : 'High-yield is lagging — spreads are widening, an early sign of credit stress.'}`,
        });
    }

    // 6. Safe-haven bid (gold vs equities, 3m)
    const gold = data.get(S.gold);
    if (gold && spy && gold.length > 70 && spy.length > 70) {
        const gR = retOf(gold, 63) ?? 0;
        const sR = retOf(spy, 63) ?? 0;
        const rel = gR - sR; // gold beating stocks = risk-off rotation
        const cls: Classification = rel < 0 ? 'bullish' : rel < 4 ? 'neutral' : rel < 9 ? 'bearish' : 'extreme';
        out.push({
            key: 'safe-haven', label: 'Safe-haven rotation (gold vs equities)', group: 'Market', provenance: 'live',
            classification: cls, weight: 0.7, value: `${fmtPct(rel)} 3m gold−S&P`,
            detail: `Gold has outperformed the S&P by ${fmtPct(rel)} over 3 months. ${cls === 'bullish' || cls === 'neutral' ? 'No defensive rotation into hard assets.' : 'Money is rotating toward safety — a classic late-cycle tell (though gold can also rise on debasement, not just fear).'}`,
        });
    }

    // 7. Concentration (cap-weight SPY vs equal-weight RSP, 1y)
    const rsp = data.get(S.equalWeight);
    if (spy && rsp && spy.length > 252 && rsp.length > 252) {
        const sR = retOf(spy, 252) ?? 0;
        const eR = retOf(rsp, 252) ?? 0;
        const gap = sR - eR; // cap-weight beating equal-weight = narrow leadership
        const cls: Classification = gap < 3 ? 'bullish' : gap < 8 ? 'neutral' : gap < 15 ? 'bearish' : 'extreme';
        out.push({
            key: 'concentration', label: 'Concentration (cap- vs equal-weight)', group: 'Speculation', provenance: 'live',
            classification: cls, weight: 1.1, value: `${fmtPct(gap)} 1y SPY−RSP`,
            detail: `Cap-weighted S&P has beaten the equal-weight index by ${fmtPct(gap)} over a year. ${cls === 'bullish' ? 'Gains are broad-based.' : cls === 'extreme' ? 'Extreme narrowness — a few mega-caps are the market, echoing 1999–2000.' : 'Leadership is narrowing toward the largest names.'}`,
        });
    }

    // 8. Drawdown / distance from highs (SPY off 52w high)
    if (spy && spy.length > 60) {
        const off = offHighOf(spy);
        if (off != null) {
            const cls: Classification = off > -3 ? 'bullish' : off > -10 ? 'neutral' : off > -20 ? 'bearish' : 'extreme';
            out.push({
                key: 'drawdown', label: 'Distance from highs', group: 'Market', provenance: 'live',
                classification: cls, weight: 0.7, value: `${fmtPct(off)} off high`,
                detail: `The S&P is ${fmtPct(off)} from its 52-week high. ${cls === 'bullish' ? 'At/near highs — trend intact (but tops form at highs).' : cls === 'extreme' ? 'Already in a deep drawdown — the correction is underway.' : 'Off the highs — a pullback in progress.'}`,
            });
        }
    }

    // 9. Speculative froth (high-beta basket: extension + RSI)
    const frothScores: number[] = [];
    for (const sym of S.froth) {
        const c = data.get(sym);
        if (!c || c.length < 60) continue;
        const ext = extOf(c, 200) ?? (retOf(c, 63) ?? 0);
        const rsi = rsiOf(c) ?? 50;
        // 0–100 froth: extension above trend + overbought RSI.
        const f = Math.max(0, Math.min(100, 0.6 * Math.max(0, Math.min(100, (ext / 50) * 100)) + 0.4 * Math.max(0, Math.min(100, ((rsi - 50) / 30) * 100))));
        frothScores.push(f);
    }
    if (frothScores.length >= 3) {
        const froth = Math.round(avg(frothScores));
        const cls: Classification = froth < 30 ? 'bullish' : froth < 55 ? 'neutral' : froth < 75 ? 'bearish' : 'extreme';
        out.push({
            key: 'froth', label: 'Speculative froth (high-beta basket)', group: 'Speculation', provenance: 'live',
            classification: cls, weight: 1.3, value: `${froth}/100`,
            detail: `A basket of the most speculative names (ARKK, crypto proxies, AI momentum) reads ${froth}/100 on trend-extension and overbought momentum. ${cls === 'bullish' ? 'Speculation is subdued.' : cls === 'extreme' ? 'Euphoric — the risk-seeking edge of the market is in full bubble behavior.' : 'Speculative appetite is elevated.'}`,
        });
    }

    return out;
}

/** Choose the closest historical analog given the live signal mix. */
function pickClosestAnalog(indicators: CrashIndicator[]): HistoricalAnalog {
    const by = (k: string) => indicators.find((i) => i.key === k)?.classification;
    const hot = (c?: Classification) => c === 'bearish' || c === 'extreme';
    // Nudge base similarities toward the regime the live data resembles.
    const adj = HISTORICAL_ANALOGS.map((a) => {
        let s = a.similarity;
        if ((a.year === '2000') && (hot(by('concentration')) || hot(by('froth')))) s += 14;
        if ((a.year === '2008') && (hot(by('credit-spreads')) || hot(by('yield-curve')))) s += 12;
        if ((a.year === '1987' || a.year === '2020') && hot(by('volatility'))) s += 12;
        if ((a.year === '1973–74') && hot(by('yield-curve'))) s += 6;
        return { ...a, similarity: Math.min(95, s) };
    });
    return adj.reduce((best, a) => (a.similarity > best.similarity ? a : best), adj[0]);
}

function buildSummary(
    score: number,
    bandLabel: string,
    drivers: CrashIndicator[],
    closest: HistoricalAnalog,
    liveCount: number
): string {
    const driverText = drivers.length
        ? drivers.map((d) => d.label.toLowerCase()).slice(0, 3).join(', ')
        : 'no single indicator';
    const phase =
        score >= 90 ? 'bubble-grade excess on multiple fronts'
        : score >= 75 ? 'a high-risk, late-cycle configuration'
        : score >= 60 ? 'a maturing, late-cycle expansion'
        : score >= 40 ? 'a mid-cycle expansion with no broad excess'
        : score >= 20 ? 'an early-cycle, low-risk environment'
        : 'washed-out, deep-value conditions';
    return `The Crash Detector reads ${score}/100 — ${bandLabel}, i.e. ${phase}. The reading is driven most by ${driverText}, computed from ${liveCount} live market signals plus the structural cycle overlay. The configuration most resembles ${closest.year} (${closest.name}), though no two cycles repeat exactly. This is a probability statement, not a forecast: late-cycle can persist for quarters, and a high score is a call for a wider margin of safety — not an imminent-crash prediction.`;
}

export async function runCrashScan(): Promise<CrashReport> {
    const { closes, dataDate } = await fetchSeries(ALL_CRASH_SYMBOLS);
    const live = buildLiveIndicators(closes);

    // Compose: live signals + structural overlay. If the live feed largely
    // failed, the structural overlay still yields a (clearly-labelled) read.
    const indicators = [...live, ...STRUCTURAL_INDICATORS];
    const score = compositeScore(indicators);
    const band = crashBand(score);
    const probabilities = scoreToProbabilities(score);
    const cycles = positionCycles(CRASH_CYCLES);
    const closestAnalog = pickClosestAnalog(indicators);

    // Top drivers = highest weight × risk contribution among bearish/extreme.
    const riskRank: Record<Classification, number> = { bullish: 0, neutral: 1, bearish: 2, extreme: 3 };
    const topDrivers = [...indicators]
        .filter((i) => i.classification === 'bearish' || i.classification === 'extreme')
        .sort((a, b) => riskRank[b.classification] * b.weight - riskRank[a.classification] * a.weight)
        .slice(0, 4);

    // Disagreements = signals pointing the other way to the consensus tilt.
    const bearishTilt = indicators.filter((i) => riskRank[i.classification] >= 2).length >= indicators.length / 2;
    const disagreements = indicators.filter((i) =>
        bearishTilt ? i.classification === 'bullish' : i.classification === 'extreme'
    ).slice(0, 4);

    const liveCount = live.length;
    const structuralCount = STRUCTURAL_INDICATORS.length;

    const scenarios = [
        {
            horizon: '6 months',
            base: score >= 60 ? 'Grind higher or chop sideways; late-cycle melt-ups are common and overbought can stay overbought.' : 'Constructive — trend and breadth support further gains.',
            risk: 'A volatility shock or a hot inflation/credit print triggers a fast 5–10% air-pocket.',
        },
        {
            horizon: '12 months',
            base: score >= 60 ? 'A 10–15% correction becomes more likely than not at some point, even within an ongoing bull.' : 'Expansion continues; a normal 10% correction is always possible but not the base case.',
            risk: `A growth scare or AI-capex disappointment starts a deeper repricing reminiscent of ${closestAnalog.year}.`,
        },
        {
            horizon: '24 months',
            base: score >= 60 ? 'The cycle turns: a recession and a 20%+ bear market are plausible as late-cycle excess unwinds.' : 'Mid-cycle persists; watch the curve and credit for the first turn.',
            risk: 'A credit event or policy error tips a correction into a 30%+ bear and recession.',
        },
        {
            horizon: '36 months',
            base: 'A full cycle low is statistically likely somewhere in this window, followed by the next recovery — the question is the path, not the eventual reset.',
            risk: 'A disorderly deleveraging if debt-cycle and concentration risks crystallize together.',
        },
    ];

    const summary = buildSummary(score, band.label, topDrivers, closestAnalog, liveCount);

    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    }).format(new Date());

    return {
        score,
        band,
        asOf,
        dataDate,
        liveCount,
        structuralCount,
        indicators,
        cycles,
        analogs: HISTORICAL_ANALOGS,
        closestAnalog,
        probabilities,
        scenarios,
        summary,
        topDrivers,
        disagreements,
        reasonsNoCrash: REASONS_NO_CRASH,
        reasonsUnderestimated: REASONS_UNDERESTIMATED,
    };
}

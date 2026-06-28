/**
 * Leg-based options payoff engine.
 *
 * A strategy is a set of legs (long/short calls, puts or stock). Everything the
 * UI shows — the payoff curve, max profit/loss, break-evens, net debit/credit —
 * is computed from the legs at expiration, so adding a strategy is just adding
 * its legs (no hand-keyed payoff numbers). Per-share math; multiply by 100 ×
 * contracts for dollar figures.
 */

import { bsPrice, bsGreeks, type Greeks } from './bs';

export interface Leg {
    type: 'call' | 'put' | 'stock';
    dir: 'long' | 'short';
    /** Option strike (ignored for stock legs). */
    strike?: number;
    /** Premium per share (filled by priceLegs); for stock legs, the entry price. */
    premium?: number;
    /** Number of contracts / round lots (default 1). */
    qty?: number;
}

export interface Scenario {
    spot: number;
    vol: number;
    days: number;
    rate: number;
}

/** Fill each leg's premium from Black–Scholes (stock legs priced at spot). */
export function priceLegs(legs: Leg[], s: Scenario): Leg[] {
    return legs.map((leg) => {
        if (leg.type === 'stock') return { ...leg, premium: s.spot };
        const premium = bsPrice(leg.type, { spot: s.spot, strike: leg.strike ?? s.spot, vol: s.vol, days: s.days, rate: s.rate });
        return { ...leg, premium };
    });
}

/** Per-share P/L of a single leg at an expiration price S. */
function legPayoff(leg: Leg, S: number): number {
    const qty = leg.qty ?? 1;
    const prem = leg.premium ?? 0;
    let intrinsic = 0;
    if (leg.type === 'call') intrinsic = Math.max(S - (leg.strike ?? 0), 0);
    else if (leg.type === 'put') intrinsic = Math.max((leg.strike ?? 0) - S, 0);
    else intrinsic = S; // stock value at S

    if (leg.type === 'stock') {
        // long stock: S - entry ; short stock: entry - S
        return (leg.dir === 'long' ? S - prem : prem - S) * qty;
    }
    // option: long pays intrinsic minus premium; short is the inverse
    return (leg.dir === 'long' ? intrinsic - prem : prem - intrinsic) * qty;
}

/** Total per-share P/L of the position at expiration price S. */
export function payoffAt(legs: Leg[], S: number): number {
    return legs.reduce((sum, leg) => sum + legPayoff(leg, S), 0);
}

/** Net debit (>0, you pay) or credit (<0, you receive), per share. */
export function netDebit(legs: Leg[]): number {
    return legs.reduce((sum, leg) => {
        const qty = leg.qty ?? 1;
        const prem = leg.premium ?? 0;
        if (leg.type === 'stock') return sum + (leg.dir === 'long' ? prem : -prem) * qty;
        return sum + (leg.dir === 'long' ? prem : -prem) * qty;
    }, 0);
}

export interface PayoffStats {
    /** Sampled curve: [price, perSharePnL]. */
    curve: [number, number][];
    /** Per-share max profit; null = unbounded. */
    maxProfit: number | null;
    /** Per-share max loss (negative); null = unbounded. */
    maxLoss: number | null;
    /** Expiration prices where P/L crosses zero. */
    breakevens: number[];
    /** Net debit (+) / credit (−) per share. */
    netDebit: number;
    /** Aggregate Greeks at the scenario (per share). */
    greeks: Greeks;
}

/** Round a strike to a sensible increment for the price level. */
export function strikeStep(spot: number): number {
    if (spot < 25) return 0.5;
    if (spot < 200) return 1;
    if (spot < 1000) return 5;
    return 10;
}
export function roundStrike(x: number, spot: number): number {
    const step = strikeStep(spot);
    return Math.round(x / step) * step;
}

/**
 * Compute the full payoff profile + Greeks. Samples expiration prices from 0 to
 * ~2.5× spot, finds extrema and zero-crossings, and flags unbounded tails.
 */
export function analyze(legs: Leg[], s: Scenario): PayoffStats {
    const hi = s.spot * 2.5;
    const N = 240;
    const curve: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
        const S = (hi * i) / N;
        curve.push([S, payoffAt(legs, S)]);
    }

    let maxP = -Infinity;
    let minP = Infinity;
    for (const [, p] of curve) {
        if (p > maxP) maxP = p;
        if (p < minP) minP = p;
    }

    // Unbounded detection from the slope of the tails.
    const tailRise = curve[N][1] - curve[N - 1][1];
    const tailFallLeft = curve[0][1] - curve[1][1];
    const upUnbounded = tailRise > 0.01;
    const downUnbounded = tailFallLeft > 0.01; // P/L rising as price → 0

    // Break-evens: linear interpolation at sign changes.
    const breakevens: number[] = [];
    for (let i = 1; i < curve.length; i++) {
        const [x0, y0] = curve[i - 1];
        const [x1, y1] = curve[i];
        if ((y0 <= 0 && y1 > 0) || (y0 >= 0 && y1 < 0)) {
            const t = y0 === y1 ? 0 : -y0 / (y1 - y0);
            breakevens.push(Math.round((x0 + t * (x1 - x0)) * 100) / 100);
        }
    }

    // Aggregate Greeks at the scenario.
    const greeks: Greeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    for (const leg of legs) {
        const qty = leg.qty ?? 1;
        if (leg.type === 'stock') {
            greeks.delta += (leg.dir === 'long' ? 1 : -1) * qty;
            continue;
        }
        const g = bsGreeks(leg.type, { spot: s.spot, strike: leg.strike ?? s.spot, vol: s.vol, days: s.days, rate: s.rate });
        const sign = leg.dir === 'long' ? 1 : -1;
        greeks.delta += sign * g.delta * qty;
        greeks.gamma += sign * g.gamma * qty;
        greeks.theta += sign * g.theta * qty;
        greeks.vega += sign * g.vega * qty;
        greeks.rho += sign * g.rho * qty;
    }

    return {
        curve,
        maxProfit: upUnbounded ? null : Math.round(maxP * 100) / 100,
        maxLoss: downUnbounded ? null : Math.round(minP * 100) / 100,
        breakevens,
        netDebit: Math.round(netDebit(legs) * 100) / 100,
        greeks,
    };
}

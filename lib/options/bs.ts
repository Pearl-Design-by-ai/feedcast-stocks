/**
 * Black–Scholes pricing + Greeks for European options.
 *
 * Used to put realistic, consistent premiums and Greek estimates behind the
 * Options Strategies education hub — every strategy example and the interactive
 * simulator price their legs from the same model, so the numbers always tie out.
 * Educational approximation only (no dividends in the base model; American-style
 * early exercise and skew are ignored).
 */

/** Standard normal PDF. */
function npdf(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Standard normal CDF via the Abramowitz–Stegun erf approximation. */
function ncdf(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-0.5 * x * x);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) p = 1 - p;
    return p;
}

export interface BsInputs {
    /** Underlying price. */
    spot: number;
    strike: number;
    /** Annualized volatility as a decimal (0.30 = 30%). */
    vol: number;
    /** Days to expiration. */
    days: number;
    /** Annual risk-free rate as a decimal (0.04 = 4%). */
    rate: number;
}

export interface Greeks {
    /** Per $1 move in the underlying. */
    delta: number;
    /** Change in delta per $1 move. */
    gamma: number;
    /** $ value lost per calendar day (negative for long options). */
    theta: number;
    /** Per 1 percentage-point change in IV. */
    vega: number;
    /** Per 1 percentage-point change in rates. */
    rho: number;
}

/** Theoretical option price. Returns intrinsic value at/after expiry. */
export function bsPrice(type: 'call' | 'put', i: BsInputs): number {
    const T = Math.max(i.days, 0) / 365;
    if (T <= 0 || i.vol <= 0) {
        return type === 'call' ? Math.max(i.spot - i.strike, 0) : Math.max(i.strike - i.spot, 0);
    }
    const { spot: S, strike: K, vol: v, rate: r } = i;
    const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T));
    const d2 = d1 - v * Math.sqrt(T);
    if (type === 'call') return S * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2);
    return K * Math.exp(-r * T) * ncdf(-d2) - S * ncdf(-d1);
}

/** Per-share Greeks (vega/rho/theta scaled to per-1%-IV / per-1%-rate / per-day). */
export function bsGreeks(type: 'call' | 'put', i: BsInputs): Greeks {
    const T = Math.max(i.days, 0) / 365;
    const { spot: S, strike: K, vol: v, rate: r } = i;
    if (T <= 0 || v <= 0) {
        const itm = type === 'call' ? S > K : S < K;
        return { delta: itm ? (type === 'call' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * sqrtT);
    const d2 = d1 - v * sqrtT;
    const pdf = npdf(d1);
    const delta = type === 'call' ? ncdf(d1) : ncdf(d1) - 1;
    const gamma = pdf / (S * v * sqrtT);
    const vega = (S * pdf * sqrtT) / 100; // per 1% change in IV
    const thetaAnnual =
        type === 'call'
            ? -(S * pdf * v) / (2 * sqrtT) - r * K * Math.exp(-r * T) * ncdf(d2)
            : -(S * pdf * v) / (2 * sqrtT) + r * K * Math.exp(-r * T) * ncdf(-d2);
    const theta = thetaAnnual / 365; // per calendar day
    const rho =
        (type === 'call'
            ? K * T * Math.exp(-r * T) * ncdf(d2)
            : -K * T * Math.exp(-r * T) * ncdf(-d2)) / 100; // per 1% change in rates
    return { delta, gamma, theta, vega, rho };
}

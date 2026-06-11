/**
 * Pure technical-analysis math over daily closes (no API calls, no React).
 * Used by the /analysis tool pages on top of fetchDailyCloses (Yahoo EOD,
 * cached 6h). Everything is close-based — we don't have intraday OHLC on the
 * free tier, so range-style measures use close-to-close approximations and
 * the UI labels them accordingly.
 */

export function sma(values: number[], n: number): number | null {
    if (values.length < n) return null;
    let sum = 0;
    for (let i = values.length - n; i < values.length; i++) sum += values[i];
    return sum / n;
}

export function ema(values: number[], n: number): number | null {
    if (values.length < n) return null;
    const k = 2 / (n + 1);
    // Seed with the SMA of the first n values, then roll forward.
    let e = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
    for (let i = n; i < values.length; i++) e = values[i] * k + e * (1 - k);
    return e;
}

export function rsi(values: number[], n = 14): number | null {
    if (values.length < n + 1) return null;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i <= n; i++) {
        const d = values[i] - values[i - 1];
        if (d >= 0) gain += d;
        else loss -= d;
    }
    let avgGain = gain / n;
    let avgLoss = loss / n;
    for (let i = n + 1; i < values.length; i++) {
        const d = values[i] - values[i - 1];
        avgGain = (avgGain * (n - 1) + Math.max(d, 0)) / n;
        avgLoss = (avgLoss * (n - 1) + Math.max(-d, 0)) / n;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}

/** % change from `back` trading days ago to the latest close. */
export function momentum(values: number[], back: number): number | null {
    if (values.length <= back) return null;
    const past = values[values.length - 1 - back];
    return past > 0 ? (values[values.length - 1] / past - 1) * 100 : null;
}

export function highestClose(values: number[], lookback: number): number | null {
    if (values.length === 0) return null;
    const slice = values.slice(-lookback);
    return Math.max(...slice);
}

export function lowestClose(values: number[], lookback: number): number | null {
    if (values.length === 0) return null;
    const slice = values.slice(-lookback);
    return Math.min(...slice);
}

/**
 * Close-to-close "ATR" proxy: average absolute daily change over n days.
 * Without intraday highs/lows this understates true range a bit — callers
 * label it as approximate.
 */
export function atrClose(values: number[], n = 14): number | null {
    if (values.length < n + 1) return null;
    let sum = 0;
    for (let i = values.length - n; i < values.length; i++) {
        sum += Math.abs(values[i] - values[i - 1]);
    }
    return sum / n;
}

/** Annualized realized volatility (%) from the last n daily closes. */
export function realizedVol(values: number[], n = 20): number | null {
    if (values.length < n + 1) return null;
    const rets: number[] = [];
    for (let i = values.length - n; i < values.length; i++) {
        rets.push(Math.log(values[i] / values[i - 1]));
    }
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function fmtUsd(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtSignedPct(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

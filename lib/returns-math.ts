/**
 * Pure multi-period return math over a daily close series — shared by the
 * returns server actions and the ETF Hub tables. Lives outside the 'use server'
 * modules because those may only export async functions.
 */

export interface PeriodReturns {
    w1: number | null;
    m1: number | null;
    m3: number | null;
    ytd: number | null;
    y1: number | null;
}

export const EMPTY_RETURNS: PeriodReturns = { w1: null, m1: null, m3: null, ytd: null, y1: null };

function pct(latest: number, past: number | undefined): number | null {
    return past && past > 0 ? (latest / past - 1) * 100 : null;
}

export function computePeriodReturns(
    closes: Array<{ date: string; close: number }>,
    year = new Date().getFullYear()
): PeriodReturns {
    if (closes.length < 2) return EMPTY_RETURNS;
    const n = closes.length;
    const latest = closes[n - 1].close;
    const at = (back: number) => (n - 1 - back >= 0 ? closes[n - 1 - back].close : undefined);
    const firstOfYear = closes.find((c) => c.date.startsWith(`${year}-`))?.close;
    return {
        w1: pct(latest, at(5)),
        m1: pct(latest, at(21)),
        m3: pct(latest, at(63)),
        ytd: pct(latest, firstOfYear),
        y1: pct(latest, at(252)),
    };
}

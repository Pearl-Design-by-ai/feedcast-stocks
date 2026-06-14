'use server';

import { getQuote } from '@/lib/actions/finnhub.actions';
import { fetchClosesRange } from '@/lib/actions/returns.actions';
import { sanitizeSymbols } from '@/lib/utils';

export interface BacktestRow {
    label: string;
    /** Cumulative total return %, weight-weighted across covered holdings. */
    pct: number | null;
    /** Annualized (CAGR) % for multi-year windows. */
    cagr: number | null;
    /** Share of portfolio weight that had enough history for this window (%). */
    coverage: number;
}

type Closes = Array<{ date: string; close: number }>;

function windowReturn(closes: Closes, kind: { ytd: true } | { years: number }): number | null {
    if (closes.length < 2) return null;
    const last = closes[closes.length - 1];
    let pastClose: number | undefined;
    if ('ytd' in kind) {
        const yr = last.date.slice(0, 4);
        pastClose = closes.find((c) => c.date.startsWith(yr))?.close;
    } else {
        const target = new Date(last.date);
        target.setFullYear(target.getFullYear() - kind.years);
        const targetIso = target.toISOString().slice(0, 10);
        // Last close on/before the target date; null if history doesn't reach it.
        for (let i = closes.length - 1; i >= 0; i--) {
            if (closes[i].date <= targetIso) { pastClose = closes[i].close; break; }
        }
    }
    if (!pastClose || pastClose <= 0) return null;
    return (last.close / pastClose - 1) * 100;
}

/**
 * Weighted historical total-return backtest of a built portfolio. Assumes the
 * target weights are held constant (i.e. periodically rebalanced); uses
 * dividend-adjusted closes. Cash contributes 0%. Windows with thin history
 * (e.g. 5Y for a young-IPO-heavy book) report lower coverage.
 */
export async function getPortfolioReturns(
    holdings: Array<{ ticker: string; weight: number; sleeve?: string }>
): Promise<{ rows: BacktestRow[] }> {
    const equityLike = holdings.filter((h) => h.ticker.toUpperCase() !== 'CASH');
    const symbols = [...new Set(equityLike.map((h) => h.ticker.toUpperCase()))];

    const closesMap = new Map<string, Closes>();
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const s = symbols[next++];
            try {
                closesMap.set(s, await fetchClosesRange(s, '5y'));
            } catch {
                closesMap.set(s, []);
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, symbols.length) }, worker));

    const windows: Array<{ label: string; kind: { ytd: true } | { years: number } }> = [
        { label: 'YTD', kind: { ytd: true } },
        { label: '1Y', kind: { years: 1 } },
        { label: '2Y', kind: { years: 2 } },
        { label: '3Y', kind: { years: 3 } },
        { label: '5Y', kind: { years: 5 } },
    ];

    const cashWeight = holdings
        .filter((h) => h.ticker.toUpperCase() === 'CASH')
        .reduce((s, h) => s + h.weight, 0);

    const rows: BacktestRow[] = windows.map(({ label, kind }) => {
        let coveredW = cashWeight; // cash always "covered", 0% return
        let acc = 0;
        for (const h of equityLike) {
            const closes = closesMap.get(h.ticker.toUpperCase());
            const r = closes ? windowReturn(closes, kind) : null;
            if (r != null) {
                coveredW += h.weight;
                acc += h.weight * r;
            }
        }
        if (coveredW < 40) return { label, pct: null, cagr: null, coverage: Math.round(coveredW) };
        const pct = acc / coveredW;
        const years = 'years' in kind ? kind.years : 0;
        const cagr = years > 1 ? (Math.pow(1 + pct / 100, 1 / years) - 1) * 100 : null;
        return {
            label,
            pct: Math.round(pct * 10) / 10,
            cagr: cagr != null ? Math.round(cagr * 10) / 10 : null,
            coverage: Math.round(coveredW),
        };
    });

    return { rows };
}

/**
 * Last prices for a basket, used by the Portfolio Lab to turn target weights
 * into approximate share counts. Bounded concurrency keeps us under the
 * Finnhub free-tier burst limit; CASH and unknowns come back null.
 */
export async function priceBasket(tickers: string[]): Promise<Record<string, number | null>> {
    const syms = sanitizeSymbols(tickers.filter((t) => t.toUpperCase() !== 'CASH'), 60);
    const out: Record<string, number | null> = {};
    let next = 0;
    async function worker() {
        while (next < syms.length) {
            const sym = syms[next++];
            try {
                const q = await getQuote(sym);
                out[sym] = q?.c ?? null;
            } catch {
                out[sym] = null;
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(4, syms.length) }, worker));
    return out;
}

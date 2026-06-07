'use server';

/**
 * Multi-period total-return approximations from Stooq's free EOD CSV. We strip
 * the exchange prefix and query `<ticker>.us`; returns are computed from close
 * prices. Cached 6h (EOD data). Best-effort — any failure yields nulls.
 */

export interface SymbolReturns {
    symbol: string;
    w1: number | null;
    m1: number | null;
    m3: number | null;
    ytd: number | null;
    y1: number | null;
}

function stooqTicker(symbol: string): string {
    return (symbol.split(':').pop() ?? symbol).trim().toLowerCase();
}

export async function fetchStooqCloses(
    symbol: string
): Promise<Array<{ date: string; close: number }>> {
    const url = `https://stooq.com/q/d/l/?s=${stooqTicker(symbol)}.us&i=d`;
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const out: Array<{ date: string; close: number }> = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const date = cols[0];
        const close = parseFloat(cols[4]);
        if (date && Number.isFinite(close)) out.push({ date, close });
    }
    return out;
}

function pct(latest: number, past: number | undefined): number | null {
    return past && past > 0 ? (latest / past - 1) * 100 : null;
}

export async function getReturns(symbols: string[]): Promise<SymbolReturns[]> {
    const year = new Date().getFullYear();
    return Promise.all(
        symbols.map(async (symbol): Promise<SymbolReturns> => {
            try {
                const closes = await fetchStooqCloses(symbol);
                if (closes.length < 2) return { symbol, w1: null, m1: null, m3: null, ytd: null, y1: null };
                const n = closes.length;
                const latest = closes[n - 1].close;
                const at = (back: number) => (n - 1 - back >= 0 ? closes[n - 1 - back].close : undefined);
                const firstOfYear = closes.find((c) => c.date.startsWith(`${year}-`))?.close;
                return {
                    symbol,
                    w1: pct(latest, at(5)),
                    m1: pct(latest, at(21)),
                    m3: pct(latest, at(63)),
                    ytd: pct(latest, firstOfYear),
                    y1: pct(latest, at(252)),
                };
            } catch {
                return { symbol, w1: null, m1: null, m3: null, ytd: null, y1: null };
            }
        })
    );
}

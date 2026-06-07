'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
// Server-only key — these actions all run server-side, so no NEXT_PUBLIC_.
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? '';

type FinnhubQuote = {
    c?: number;
    d?: number;
    dp?: number;
};

type FinnhubCompanyProfile = {
    currency?: string;
    exchange?: string;
    logo?: string;
    marketCapitalization?: number;
    name?: string;
    ticker?: string;
};

type SearchStockCandidate = FinnhubSearchResult & {
    __exchange?: string;
};

const FINNHUB_EXCHANGE_SUFFIXES = new Set([
    'AS', 'AT', 'AX', 'BA', 'BK', 'BO', 'BR', 'CO', 'DE', 'F', 'HE', 'HK',
    'IL', 'IS', 'JK', 'JO', 'KL', 'KQ', 'KS', 'L', 'LS', 'MC', 'MI', 'MX',
    'NS', 'NZ', 'OL', 'PA', 'PR', 'SA', 'SI', 'SS', 'ST', 'SW', 'SZ', 'T',
    'TA', 'TO', 'TW', 'TWO', 'V', 'VI', 'WA',
]);

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
}

export { fetchJSON };

function getExchangeLabel(symbol: string, exchange?: string) {
    if (exchange?.trim()) {
        return exchange.trim();
    }

    const parts = symbol.split('.');
    const suffix = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';

    if (!suffix) {
        return 'US';
    }

    return FINNHUB_EXCHANGE_SUFFIXES.has(suffix) ? suffix : 'US';
}

// ---------------------------------------------------------------------------
// In-memory quote cache (per server isolate).
//
// Finnhub quotes are ~15-20 min delayed, so a short shared TTL is invisible to
// users but collapses many concurrent watchlist polls into a single Finnhub
// call per symbol per window — keeping us well under the 60 req/min free-tier
// limit no matter how many users are polling. Cloudflare keeps Worker isolates
// warm and reuses them across requests, so this cache is shared across the
// requests an isolate serves. R2/ISR isn't relied on (it's intentionally off,
// see open-next.config.ts). The alert cron uses its own uncached fetch, so
// alert accuracy is never affected by this cache.
// ---------------------------------------------------------------------------
const QUOTE_CACHE_TTL_MS = 30_000;
const quoteCache = new Map<string, { value: FinnhubQuote; expiresAt: number }>();
const quoteInflight = new Map<string, Promise<FinnhubQuote | null>>();

function readQuoteCache(key: string): FinnhubQuote | undefined {
    const hit = quoteCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    if (hit) quoteCache.delete(key);
    return undefined;
}

function writeQuoteCache(key: string, value: FinnhubQuote) {
    // Bound memory: sweep expired entries if the map grows unexpectedly large.
    if (quoteCache.size > 2000) {
        const now = Date.now();
        for (const [k, v] of quoteCache) {
            if (v.expiresAt <= now) quoteCache.delete(k);
        }
    }
    quoteCache.set(key, { value, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS });
}

export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
    const key = symbol.toUpperCase();

    const cached = readQuoteCache(key);
    if (cached) return cached;

    // Collapse simultaneous requests for the same symbol into one fetch.
    const existing = quoteInflight.get(key);
    if (existing) return existing;

    const fetchPromise = (async () => {
        try {
            const token = FINNHUB_API_KEY;
            const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
            const quote = await fetchJSON<FinnhubQuote>(url, 0);
            if (quote) writeQuoteCache(key, quote);
            return quote;
        } catch (e) {
            console.error('Error fetching quote for', symbol, e);
            return null;
        } finally {
            quoteInflight.delete(key);
        }
    })();

    quoteInflight.set(key, fetchPromise);
    return fetchPromise;
}

export async function getCompanyProfile(symbol: string) {
    try {
        const token = FINNHUB_API_KEY;
        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        // Cache profile for 24 hours
        return await fetchJSON<FinnhubCompanyProfile>(url, 86400);
    } catch (e) {
        console.error('Error fetching profile for', symbol, e);
        return null;
    }
}

type FinnhubMetricResponse = {
    metric?: Record<string, number | null>;
};

// Trailing P/E from the `stock/metric` endpoint. Cached for an hour to keep
// well under the Finnhub free-tier rate limit (fundamentals barely move
// intraday). Returns null when unavailable.
export async function getPeRatio(symbol: string): Promise<number | null> {
    try {
        const token = FINNHUB_API_KEY;
        if (!token) return null;
        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
        const data = await fetchJSON<FinnhubMetricResponse>(url, 3600);
        const pe = data?.metric?.peTTM ?? data?.metric?.peBasicExclExtraTTM ?? null;
        return typeof pe === 'number' && Number.isFinite(pe) ? pe : null;
    } catch (e) {
        console.error('Error fetching P/E for', symbol, e);
        return null;
    }
}

export type WatchlistStockData = {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    name: string;
    logo?: string;
    marketCap?: number;
    peRatio: number | null;
};

export async function getWatchlistData(symbols: string[]): Promise<WatchlistStockData[]> {
    if (!symbols || symbols.length === 0) return [];

    // Fetch quote, profile and fundamentals in parallel per symbol.
    const promises = symbols.map(async (sym) => {
        const [quote, profile, peRatio] = await Promise.all([
            getQuote(sym),
            getCompanyProfile(sym),
            getPeRatio(sym),
        ]);

        return {
            symbol: sym,
            price: quote?.c || 0,
            change: quote?.d || 0,
            changePercent: quote?.dp || 0,
            currency: profile?.currency || 'USD',
            name: profile?.name || sym,
            logo: profile?.logo,
            marketCap: profile?.marketCapitalization,
            peRatio,
        };
    });

    return await Promise.all(promises);
}

// Lightweight quote-only refresh for client polling — one Finnhub call per
// symbol instead of the three `getWatchlistData` makes. Profiles and P/E
// don't change intraday, so polling only needs fresh prices.
export async function getWatchlistQuotes(
    symbols: string[]
): Promise<{ symbol: string; price: number; change: number; changePercent: number }[]> {
    if (!symbols || symbols.length === 0) return [];

    return Promise.all(
        symbols.map(async (sym) => {
            const quote = await getQuote(sym);
            return {
                symbol: sym,
                price: quote?.c || 0,
                change: quote?.d || 0,
                changePercent: quote?.dp || 0,
            };
        })
    );
}


export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = FINNHUB_API_KEY;
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }
        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        // If we have symbols, try to fetch company news per symbol and round-robin select
        if (cleanSymbols.length > 0) {
            const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

            await Promise.all(
                cleanSymbols.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                        const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                        perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        perSymbolArticles[sym] = [];
                    }
                })
            );

            const collected: MarketNewsArticle[] = [];
            // Round-robin up to 6 picks
            for (let round = 0; round < maxArticles; round++) {
                for (let i = 0; i < cleanSymbols.length; i++) {
                    const sym = cleanSymbols[i];
                    const list = perSymbolArticles[sym] || [];
                    if (list.length === 0) continue;
                    const article = list.shift();
                    if (!article || !validateArticle(article)) continue;
                    collected.push(formatArticle(article, true, sym, round));
                    if (collected.length >= maxArticles) break;
                }
                if (collected.length >= maxArticles) break;
            }

            if (collected.length > 0) {
                // Sort by datetime desc
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
            // If none collected, fall through to general news
        }

        // General market news fallback or when no symbols provided
        const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

        const seen = new Set<string>();
        const unique: RawNewsArticle[] = [];
        for (const art of general || []) {
            if (!validateArticle(art)) continue;
            const key = `${art.id}-${art.url}-${art.headline}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(art);
            if (unique.length >= 20) break; // cap early before final slicing
        }

        const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
        return formatted;
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
        const token = FINNHUB_API_KEY;
        if (!token) {
            // If no token, log and return empty to avoid throwing per requirements
            console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
            return [];
        }

        const trimmed = typeof query === 'string' ? query.trim() : '';

        let results: SearchStockCandidate[] = [];

        if (!trimmed) {
            // Fetch top 10 popular symbols' profiles
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
            const profiles = await Promise.all(
                top.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
                        // Revalidate every hour
                        const profile = await fetchJSON<FinnhubCompanyProfile>(url, 3600);
                        return { sym, profile } as { sym: string; profile: FinnhubCompanyProfile | null };
                    } catch (e) {
                        console.error('Error fetching profile2 for', sym, e);
                        return { sym, profile: null } as { sym: string; profile: FinnhubCompanyProfile | null };
                    }
                })
            );

            results = profiles
                .map(({ sym, profile }) => {
                    const symbol = sym.toUpperCase();
                    const name: string | undefined = profile?.name || profile?.ticker || undefined;
                    const exchange: string | undefined = profile?.exchange || undefined;
                    if (!name) return undefined;
                    const r: SearchStockCandidate = {
                        symbol,
                        description: name,
                        displaySymbol: symbol,
                        type: 'Common Stock',
                    };
                    r.__exchange = exchange;
                    return r;
                })
                .filter((x): x is SearchStockCandidate => Boolean(x));
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data?.result) ? data.result : [];
        }

        const mapped: StockWithWatchlistStatus[] = results
            .map((r) => {
                const upper = (r.symbol || '').toUpperCase();
                const name = r.description || upper;
                const exchangeFromProfile = r.__exchange;
                const exchange = getExchangeLabel(upper, exchangeFromProfile);
                const type = r.type || 'Stock';
                const item: StockWithWatchlistStatus = {
                    symbol: upper,
                    name,
                    exchange,
                    type,
                    isInWatchlist: false,
                };
                return item;
            })
            .slice(0, 15);

        return mapped;
    } catch (err) {
        console.error('Error in stock search:', err);
        return [];
    }
});

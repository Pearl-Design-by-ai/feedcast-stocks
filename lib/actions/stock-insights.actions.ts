'use server';

/** Analyst recommendation trends from Finnhub (free tier). Server-only key. */

import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? '';

export interface RecommendationTrend {
    symbol: string;
    period: string; // YYYY-MM-DD (month)
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
}

export async function getRecommendationTrends(symbol: string): Promise<RecommendationTrend[]> {
    if (!FINNHUB_API_KEY) return [];
    try {
        const url = `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(
            symbol.toUpperCase()
        )}&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<RecommendationTrend[]>(url, 3600);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('getRecommendationTrends error:', err);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Key fundamentals — the same `stock/metric?metric=all` response getPeRatio
// reads one number from. All free tier; cached 1h (KV-shared).
// ---------------------------------------------------------------------------

export interface KeyMetrics {
    high52: number | null;
    low52: number | null;
    beta: number | null;
    peTTM: number | null;
    psTTM: number | null;
    pb: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    roe: number | null;
    roa: number | null;
    dividendYield: number | null;
    payoutRatio: number | null;
    epsTTM: number | null;
    revenueGrowthYoy: number | null;
    currentRatio: number | null;
    debtToEquity: number | null;
}

function num(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export async function getKeyMetrics(symbol: string): Promise<KeyMetrics | null> {
    if (!FINNHUB_API_KEY) return null;
    try {
        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(
            symbol.toUpperCase()
        )}&metric=all&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<{ metric?: Record<string, unknown> }>(url, 3600);
        const m = data?.metric;
        if (!m) return null;
        return {
            high52: num(m['52WeekHigh']),
            low52: num(m['52WeekLow']),
            beta: num(m.beta),
            peTTM: num(m.peTTM) ?? num(m.peBasicExclExtraTTM),
            psTTM: num(m.psTTM),
            pb: num(m.pb) ?? num(m.pbQuarterly),
            grossMargin: num(m.grossMarginTTM),
            operatingMargin: num(m.operatingMarginTTM),
            netMargin: num(m.netProfitMarginTTM),
            roe: num(m.roeTTM),
            roa: num(m.roaTTM),
            dividendYield: num(m.currentDividendYieldTTM) ?? num(m.dividendYieldIndicatedAnnual),
            payoutRatio: num(m.payoutRatioTTM),
            epsTTM: num(m.epsTTM) ?? num(m.epsBasicExclExtraItemsTTM),
            revenueGrowthYoy: num(m.revenueGrowthTTMYoy),
            currentRatio: num(m.currentRatioQuarterly),
            debtToEquity: num(m['totalDebt/totalEquityQuarterly']),
        };
    } catch (err) {
        console.error('getKeyMetrics error:', err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// EPS surprises — last reported quarters (free tier). Cached 6h.
// ---------------------------------------------------------------------------

export interface EpsSurprise {
    period: string; // YYYY-MM-DD
    actual: number | null;
    estimate: number | null;
    surprisePercent: number | null;
}

export async function getEpsSurprises(symbol: string): Promise<EpsSurprise[]> {
    if (!FINNHUB_API_KEY) return [];
    try {
        const url = `${FINNHUB_BASE_URL}/stock/earnings?symbol=${encodeURIComponent(
            symbol.toUpperCase()
        )}&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<
            Array<{ period?: string; actual?: number; estimate?: number; surprisePercent?: number }>
        >(url, 21600);
        if (!Array.isArray(data)) return [];
        return data
            .filter((d) => d.period)
            .slice(0, 4)
            .map((d) => ({
                period: d.period!,
                actual: num(d.actual),
                estimate: num(d.estimate),
                surprisePercent: num(d.surprisePercent),
            }));
    } catch (err) {
        console.error('getEpsSurprises error:', err);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Peers — similar companies (free tier). Cached 24h.
// ---------------------------------------------------------------------------

export async function getPeers(symbol: string): Promise<string[]> {
    if (!FINNHUB_API_KEY) return [];
    try {
        const url = `${FINNHUB_BASE_URL}/stock/peers?symbol=${encodeURIComponent(
            symbol.toUpperCase()
        )}&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<string[]>(url, 86400);
        const upper = symbol.toUpperCase();
        return Array.isArray(data)
            ? data.filter((p) => typeof p === 'string' && p && p.toUpperCase() !== upper).slice(0, 8)
            : [];
    } catch (err) {
        console.error('getPeers error:', err);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Insider activity — recent transactions + monthly sentiment (free tier).
// Cached 6h.
// ---------------------------------------------------------------------------

export interface InsiderTransaction {
    name: string;
    share: number | null;
    change: number | null;
    transactionDate: string;
    transactionPrice: number | null;
    transactionCode: string;
}

export interface InsiderActivityData {
    transactions: InsiderTransaction[];
    /** Net monthly insider buy/sell pressure (Finnhub MSPR, −100..100) for the latest months. */
    sentiment: Array<{ month: string; mspr: number; change: number }>;
}

function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
}

export async function getInsiderActivity(symbol: string): Promise<InsiderActivityData | null> {
    if (!FINNHUB_API_KEY) return null;
    const sym = symbol.toUpperCase();
    try {
        const txUrl = `${FINNHUB_BASE_URL}/stock/insider-transactions?symbol=${encodeURIComponent(
            sym
        )}&from=${isoDaysAgo(120)}&token=${FINNHUB_API_KEY}`;
        const sentUrl = `${FINNHUB_BASE_URL}/stock/insider-sentiment?symbol=${encodeURIComponent(
            sym
        )}&from=${isoDaysAgo(365)}&to=${new Date().toISOString().slice(0, 10)}&token=${FINNHUB_API_KEY}`;

        const [tx, sent] = await Promise.all([
            fetchJSON<{
                data?: Array<{
                    name?: string;
                    share?: number;
                    change?: number;
                    transactionDate?: string;
                    transactionPrice?: number;
                    transactionCode?: string;
                }>;
            }>(txUrl, 21600).catch(() => null),
            fetchJSON<{
                data?: Array<{ year?: number; month?: number; mspr?: number; change?: number }>;
            }>(sentUrl, 21600).catch(() => null),
        ]);

        const transactions: InsiderTransaction[] = (tx?.data ?? [])
            .filter((t) => t.name && t.transactionDate)
            .sort((a, b) => (b.transactionDate ?? '').localeCompare(a.transactionDate ?? ''))
            .slice(0, 8)
            .map((t) => ({
                name: t.name!,
                share: num(t.share),
                change: num(t.change),
                transactionDate: t.transactionDate!,
                transactionPrice: num(t.transactionPrice),
                transactionCode: t.transactionCode ?? '',
            }));

        const sentiment = (sent?.data ?? [])
            .filter((s) => s.year && s.month && typeof s.mspr === 'number')
            .sort((a, b) => b.year! * 100 + b.month! - (a.year! * 100 + a.month!))
            .slice(0, 6)
            .map((s) => ({
                month: `${s.year}-${String(s.month).padStart(2, '0')}`,
                mspr: s.mspr!,
                change: s.change ?? 0,
            }));

        if (transactions.length === 0 && sentiment.length === 0) return null;
        return { transactions, sentiment };
    } catch (err) {
        console.error('getInsiderActivity error:', err);
        return null;
    }
}

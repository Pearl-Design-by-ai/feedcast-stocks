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

'use server';

/**
 * Earnings and IPO calendars from Finnhub (free tier). Server-only key.
 */

import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? '';

export interface EarningsEvent {
    symbol: string;
    date: string;
    hour: string; // 'bmo' | 'amc' | 'dmh' | ''
    epsEstimate: number | null;
    epsActual: number | null;
    revenueEstimate: number | null;
    revenueActual: number | null;
    quarter: number | null;
    year: number | null;
}

export interface IpoEvent {
    symbol: string;
    name: string;
    date: string;
    exchange: string;
    price: string;
    numberOfShares: number | null;
    status: string;
}

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

/** Upcoming earnings for the next `days` days (default 14). */
export async function getEarningsCalendar(days = 14): Promise<EarningsEvent[]> {
    if (!FINNHUB_API_KEY) return [];
    const from = isoDate(new Date());
    const to = isoDate(new Date(Date.now() + days * 86400_000));
    try {
        const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<{ earningsCalendar?: EarningsEvent[] }>(url, 1800);
        return (data.earningsCalendar ?? []).sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
        console.error('getEarningsCalendar error:', err);
        return [];
    }
}

/** IPOs from a week ago through the next `days` days (default 30). */
export async function getIpoCalendar(days = 30): Promise<IpoEvent[]> {
    if (!FINNHUB_API_KEY) return [];
    const from = isoDate(new Date(Date.now() - 7 * 86400_000));
    const to = isoDate(new Date(Date.now() + days * 86400_000));
    try {
        const url = `${FINNHUB_BASE_URL}/calendar/ipo?from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        const data = await fetchJSON<{ ipoCalendar?: IpoEvent[] }>(url, 1800);
        return (data.ipoCalendar ?? []).sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
        console.error('getIpoCalendar error:', err);
        return [];
    }
}

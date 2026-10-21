/**
 * Aggregation for the owner stats page (/my-stats). Pure — the page fetches
 * raw rows with the service role and hands them here.
 *
 * Note on uniques: visitor_hash rotates daily, so a visitor is only "the same"
 * within one UTC day. Unique visitors are therefore counted per day (and the
 * period figure is the sum of daily uniques), and returning visitors can only
 * be recognised through a stable user_id — i.e. signed-in visitors.
 */

import { extractTicker } from './shared';

export interface PageViewRow {
    created_at: string;
    path: string | null;
    referrer_host: string | null;
    country: string | null;
    device: string | null;
    visitor_hash: string | null;
    user_id: string | null;
    is_owner: boolean;
    is_bot: boolean;
}

export interface StatsOptions {
    days: number;
    now: Date;
    includeOwner: boolean;
    includeBots: boolean;
}

export interface DayPoint {
    day: string;
    views: number;
    uniques: number;
}

export type Ranked = { key: string; count: number }[];

export interface Stats {
    days: number;
    pageViews: number;
    /** Sum over days of distinct visitor_hash that day. */
    uniqueVisitors: number;
    /** Views with no visitor hash (DNT / Sec-GPC). */
    optOutViews: number;
    /** Identities (user_id) seen on 2+ distinct days in the period. */
    returningVisitors: number;
    /** Distinct non-owner signed-in user_ids — always excludes the owner. */
    signedInUserIds: string[];
    daily: DayPoint[];
    topPages: Ranked;
    topTickers: Ranked;
    topReferrers: Ranked;
    countries: Ranked;
    devices: Ranked;
    bots: { count: number; total: number; share: number };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC day keys for the window ending today, oldest first. */
export function dayKeys(days: number, now: Date): string[] {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Array.from({ length: days }, (_, i) => new Date(today - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

/** First instant of the window (00:00 UTC, `days - 1` days ago). */
export function windowStart(days: number, now: Date): string {
    return `${dayKeys(days, now)[0]}T00:00:00.000Z`;
}

function rank(counts: Map<string, number>, limit: number): Ranked {
    return [...counts]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
        .slice(0, limit);
}

function bump(m: Map<string, number>, key: string | null | undefined) {
    if (key) m.set(key, (m.get(key) ?? 0) + 1);
}

export function aggregateStats(rows: PageViewRow[], opts: StatsOptions, limit = 10): Stats {
    const keys = dayKeys(opts.days, opts.now);
    const start = windowStart(opts.days, opts.now);
    const inWindow = rows.filter((r) => r.created_at >= start && (opts.includeOwner || !r.is_owner));

    const botCount = inWindow.filter((r) => r.is_bot).length;
    const counted = opts.includeBots ? inWindow : inWindow.filter((r) => !r.is_bot);

    const dayViews = new Map<string, number>(keys.map((k) => [k, 0]));
    const dayHashes = new Map<string, Set<string>>(keys.map((k) => [k, new Set<string>()]));
    const userDays = new Map<string, Set<string>>();
    const signedIn = new Set<string>();
    const pages = new Map<string, number>();
    const tickers = new Map<string, number>();
    const referrers = new Map<string, number>();
    const countries = new Map<string, number>();
    const devices = new Map<string, number>();
    let optOutViews = 0;

    for (const r of counted) {
        const day = new Date(r.created_at).toISOString().slice(0, 10);
        bump(dayViews, day);
        if (r.visitor_hash) dayHashes.get(day)?.add(r.visitor_hash);
        else optOutViews += 1;
        if (r.user_id) {
            if (!userDays.has(r.user_id)) userDays.set(r.user_id, new Set());
            userDays.get(r.user_id)!.add(day);
            if (!r.is_owner) signedIn.add(r.user_id);
        }
        bump(pages, r.path);
        bump(tickers, extractTicker(r.path));
        bump(referrers, r.referrer_host);
        bump(countries, r.country);
        bump(devices, r.device);
    }

    const daily = keys.map((day) => ({ day, views: dayViews.get(day) ?? 0, uniques: dayHashes.get(day)?.size ?? 0 }));

    return {
        days: opts.days,
        pageViews: counted.length,
        uniqueVisitors: daily.reduce((s, d) => s + d.uniques, 0),
        optOutViews,
        returningVisitors: [...userDays.values()].filter((d) => d.size >= 2).length,
        signedInUserIds: [...signedIn].sort(),
        daily,
        topPages: rank(pages, limit),
        topTickers: rank(tickers, limit),
        topReferrers: rank(referrers, limit),
        countries: rank(countries, limit),
        devices: rank(devices, limit),
        bots: { count: botCount, total: inWindow.length, share: inWindow.length ? botCount / inWindow.length : 0 },
    };
}

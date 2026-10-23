import { NextRequest, NextResponse } from 'next/server';
import { POWER_USER_EMAILS } from '@/lib/constants';
import { finnhubCallCount } from '@/lib/finnhub-base';
import { swrCached } from '@/lib/swr-cache';
import { warmSymbols, rotateForRun } from '@/lib/warm-symbols';
import { getCompanyProfile, getNews } from '@/lib/actions/finnhub.actions';
import {
    getKeyMetrics,
    getRecommendationTrends,
    getEpsSurprises,
    getPeers,
    getInsiderActivity,
} from '@/lib/actions/stock-insights.actions';
import { getEarningsCalendar } from '@/lib/actions/calendar.actions';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getCompanyScore } from '@/lib/actions/company-score.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';

/**
 * Stock-page cache warm-up.
 *
 * Triggered every 10 minutes by the `feedcast-stocks-cron` Worker (same
 * Bearer CRON_SECRET as check-alerts). Walks the top ~50 popular symbols plus
 * the owner's watchlist and touches every SWR-cached read the stock page
 * makes, so first views never pay a cold upstream. Fresh entries cost
 * nothing; stale ones trigger one background refresh; only missing ones fetch.
 *
 * Deliberately light:
 * - Finnhub (free tier, 60/min shared with real users) is paced to ~30/min by
 *   sleeping 2s per live call this run made, and the run stops after 8 min.
 *   The start offset rotates each run so a cold first pass covers everyone.
 * - AI generations (brief, consensus, performance note) and Adanos are NOT
 *   warmed — warming them would add LLM / quota spend; they fill on first view.
 * - Quotes aren't warmed: they go stale in 30s and the page's price is the
 *   client-side TradingView embed.
 * - The owner's watchlist is read-only (select on stock_watchlist), cached 1h.
 */
export const runtime = 'nodejs';
export const maxDuration = 600;
export const dynamic = 'force-dynamic';

const MS_PER_FINNHUB_CALL = 2_000;
const RUN_BUDGET_MS = 8 * 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return (request.headers.get('authorization') ?? '') === `Bearer ${secret}`;
}

async function ownerWatchlist(): Promise<string[]> {
    const symbols = await swrCached<string[]>(
        'warm:owner-watchlist',
        { fresh: 3600, stale: 86_400, shouldCache: (v) => v.length > 0 },
        () => getWatchlistSymbolsByEmail(POWER_USER_EMAILS[0])
    );
    return symbols ?? [];
}

async function warmOne(symbol: string): Promise<void> {
    await Promise.all([
        getCompanyProfile(symbol),
        getKeyMetrics(symbol),
        getRecommendationTrends(symbol),
        getEpsSurprises(symbol),
        getPeers(symbol),
        getInsiderActivity(symbol),
        getNews([symbol]).catch(() => []),
        fetchDailyCloses(symbol, 2_500).catch(() => []),
        getCompanyScore(symbol),
    ]);
}

async function handle(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const started = Date.now();
    const owner = await ownerWatchlist().catch(() => []);
    const symbols = warmSymbols(owner);
    const ordered = rotateForRun(symbols, started);

    const callsAtStart = finnhubCallCount();
    await getEarningsCalendar(60).catch(() => []); // shared by every EarningsPanel

    let warmed = 0;
    for (const symbol of ordered) {
        if (Date.now() - started > RUN_BUDGET_MS) break;
        const before = finnhubCallCount();
        await warmOne(symbol).catch((err) => console.error('warm-stocks failed for', symbol, err));
        warmed++;
        const live = finnhubCallCount() - before;
        if (live > 0) await sleep(live * MS_PER_FINNHUB_CALL);
    }

    const result = {
        symbols: symbols.length,
        ownerSymbols: owner.length,
        warmed,
        finnhubCalls: finnhubCallCount() - callsAtStart,
        ms: Date.now() - started,
    };
    console.log('[warm-stocks]', JSON.stringify(result));
    return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
    return handle(request);
}

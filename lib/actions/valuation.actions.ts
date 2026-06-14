'use server';

import { getMarketKV } from '@/lib/market-cache';
import {
    VALUATION_UNIVERSE,
    VALUATION_TOP_N,
    VAL_METRICS_KEY,
    VAL_SCREEN_KEY,
    VAL_LOCK_KEY,
    currentSession,
    type ValuationEntry,
    type ValuationScreen,
} from '@/lib/valuation';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const SEVEN_DAYS = 7 * 24 * 60 * 60;
/** Max Finnhub calls per scan run — keeps one paced run inside the rate-limit
 *  budget; the cron advances the scan a chunk at a time after each close. */
const MAX_FETCH_PER_RUN = 50;

type Metric = { pe: number | null; ps: number | null; dy: number | null };
/** `s` = the trading session this metric was fetched for. */
type MetricRecord = Metric & { s: string };
type MetricsMap = Record<string, MetricRecord>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** One Finnhub `metric=all` call → the valuation fields we rank on. */
async function fetchMetricLive(symbol: string): Promise<Metric | null> {
    const token = process.env.FINNHUB_API_KEY;
    if (!token) return null;
    try {
        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = (await res.json()) as { metric?: Record<string, number | null> };
        const m = data?.metric ?? {};
        return {
            pe: num(m.peTTM) ?? num(m.peBasicExclExtraTTM),
            ps: num(m.psTTM) ?? num(m.psAnnual),
            dy: num(m.currentDividendYieldTTM) ?? num(m.dividendYieldIndicatedAnnual),
        };
    } catch {
        return null;
    }
}

function buildScreen(map: MetricsMap, session: string): ValuationScreen {
    const recorded = VALUATION_UNIVERSE.map((symbol) =>
        map[symbol] ? { symbol, ...map[symbol] } : null
    ).filter((e): e is { symbol: string } & MetricRecord => e !== null);

    const valued: ValuationEntry[] = recorded
        .filter((e) => typeof e.pe === 'number' && e.pe > 0)
        .map((e) => ({ symbol: e.symbol, pe: e.pe as number, ps: e.ps, dy: e.dy }));

    const cheapest = [...valued].sort((a, b) => a.pe - b.pe).slice(0, VALUATION_TOP_N);
    const priciest = [...valued].sort((a, b) => b.pe - a.pe).slice(0, VALUATION_TOP_N);

    // "Covered" = fetched for this session (incl. no-earnings names); the screen
    // is complete once the whole universe has been refreshed since the close.
    const covered = VALUATION_UNIVERSE.filter((s) => map[s]?.s === session).length;

    return {
        asOf: new Date().toISOString(),
        session,
        complete: covered >= VALUATION_UNIVERSE.length,
        scanned: valued.length,
        universe: VALUATION_UNIVERSE.length,
        noEarnings: recorded.length - valued.length,
        cheapest,
        priciest,
    };
}

/**
 * Incremental session batch. Refreshes up to MAX_FETCH_PER_RUN symbols that
 * haven't been fetched yet for the current trading session (paced under the
 * free-tier limit), rebuilds both ranked lists, and stores the screen. Called
 * a chunk at a time by the cron after each close, so the whole universe is
 * rebuilt over a handful of runs; partial runs still render.
 */
export async function runValuationScan(): Promise<ValuationScreen> {
    const kv = await getMarketKV();
    const map: MetricsMap = kv ? (((await kv.get(VAL_METRICS_KEY, 'json')) as MetricsMap | null) ?? {}) : {};

    const session = currentSession();
    const need = VALUATION_UNIVERSE.filter((s) => map[s]?.s !== session);

    let fetched = 0;
    for (const sym of need) {
        if (fetched >= MAX_FETCH_PER_RUN) break;
        const m = await fetchMetricLive(sym);
        if (m) map[sym] = { ...m, s: session }; // record successes (incl. no-earnings); retry errors next run
        fetched += 1;
        if (fetched < MAX_FETCH_PER_RUN) await sleep(1100); // ~55 calls/min, under the 60/min cap
    }

    if (kv) {
        try {
            await kv.put(VAL_METRICS_KEY, JSON.stringify(map), { expirationTtl: SEVEN_DAYS });
        } catch {
            /* non-fatal */
        }
    }

    const screen = buildScreen(map, session);
    if (kv) {
        try {
            await kv.put(VAL_SCREEN_KEY, JSON.stringify(screen), { expirationTtl: SEVEN_DAYS });
        } catch {
            /* non-fatal */
        }
    }
    return screen;
}

/** Current stored screen, or null before the first run. */
export async function getValuationScreen(): Promise<ValuationScreen | null> {
    const kv = await getMarketKV();
    if (!kv) return null;
    try {
        return ((await kv.get(VAL_SCREEN_KEY, 'json')) as ValuationScreen | null) ?? null;
    } catch {
        return null;
    }
}

/** Kick a background scan (once at a time) when the screen is stale or still filling. */
async function triggerBackgroundScan(): Promise<void> {
    const kv = await getMarketKV();
    if (!kv) return; // no KV (dev/build) — nothing to store, skip
    try {
        if (await kv.get(VAL_LOCK_KEY, 'json')) return; // a scan is already running
        await kv.put(VAL_LOCK_KEY, JSON.stringify(Date.now()), { expirationTtl: 90 });
    } catch {
        return;
    }

    const task = (async () => {
        try {
            await runValuationScan();
        } catch {
            /* swallow — best effort */
        }
    })();

    try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        const ctx = getCloudflareContext().ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
        if (ctx?.waitUntil) {
            ctx.waitUntil(task);
            return;
        }
    } catch {
        /* no Cloudflare ctx available */
    }
    // Fall back to fire-and-forget; don't block the render on a ~55s scan.
    void task;
}

/**
 * Read the screen for the page. The cron rebuilds it after each market close;
 * this also fires a best-effort background refresh when the stored screen isn't
 * built for the current session yet (e.g. a cold cache before the next cron
 * tick). Returns whatever is currently stored (may be partial or null).
 */
export async function ensureFreshScreen(): Promise<ValuationScreen | null> {
    const screen = await getValuationScreen();
    const needs = !screen || screen.session !== currentSession() || !screen.complete;
    if (needs) await triggerBackgroundScan();
    return screen;
}

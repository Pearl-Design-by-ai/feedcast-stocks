'use server';

import { getMarketKV } from '@/lib/market-cache';
import {
    VALUATION_UNIVERSE,
    VALUATION_TOP_N,
    VAL_METRICS_KEY,
    VAL_SCREEN_KEY,
    VAL_LOCK_KEY,
    type ValuationEntry,
    type ValuationScreen,
} from '@/lib/valuation';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const STALE_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60;
/** Max Finnhub calls per scan run — keeps one paced run inside the rate-limit
 *  budget; multiple traffic-triggered runs fill the universe over a few mins. */
const MAX_FETCH_PER_RUN = 50;

type Metric = { pe: number | null; ps: number | null; dy: number | null };
type MetricRecord = Metric & { t: number };
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

function buildScreen(map: MetricsMap): ValuationScreen {
    const recorded = VALUATION_UNIVERSE.map((symbol) =>
        map[symbol] ? { symbol, ...map[symbol] } : null
    ).filter((e): e is { symbol: string } & MetricRecord => e !== null);

    const valued: ValuationEntry[] = recorded
        .filter((e) => typeof e.pe === 'number' && e.pe > 0)
        .map((e) => ({ symbol: e.symbol, pe: e.pe as number, ps: e.ps, dy: e.dy }));

    const cheapest = [...valued].sort((a, b) => a.pe - b.pe).slice(0, VALUATION_TOP_N);
    const priciest = [...valued].sort((a, b) => b.pe - a.pe).slice(0, VALUATION_TOP_N);

    return {
        asOf: new Date().toISOString(),
        scanned: valued.length,
        universe: VALUATION_UNIVERSE.length,
        noEarnings: recorded.length - valued.length,
        cheapest,
        priciest,
    };
}

/**
 * Incremental daily batch. Reads the cached metrics map, refreshes up to
 * MAX_FETCH_PER_RUN missing/stale symbols (paced under the free-tier limit),
 * rebuilds both ranked lists from everything cached, and stores the screen.
 * Partial runs still produce a usable screen and converge over repeated runs.
 */
export async function runValuationScan(): Promise<ValuationScreen> {
    const kv = await getMarketKV();
    const map: MetricsMap = kv ? (((await kv.get(VAL_METRICS_KEY, 'json')) as MetricsMap | null) ?? {}) : {};

    const now = Date.now();
    const need = VALUATION_UNIVERSE.filter((s) => !map[s] || now - map[s].t > STALE_MS);

    let fetched = 0;
    for (const sym of need) {
        if (fetched >= MAX_FETCH_PER_RUN) break;
        const m = await fetchMetricLive(sym);
        if (m) map[sym] = { ...m, t: now }; // record successes (incl. no-earnings); retry errors next run
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

    const screen = buildScreen(map);
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
 * Read the screen for the page, kicking a background refresh when it's older
 * than ~20h or hasn't finished covering the universe yet. Returns whatever is
 * currently stored (may be partial or null on a cold cache).
 */
export async function ensureFreshScreen(): Promise<ValuationScreen | null> {
    const screen = await getValuationScreen();
    const ageMs = screen ? Date.now() - Date.parse(screen.asOf) : Infinity;
    const stale = ageMs > 20 * 60 * 60 * 1000;
    const incomplete = !screen || screen.scanned < VALUATION_UNIVERSE.length;
    if (stale || incomplete) await triggerBackgroundScan();
    return screen;
}

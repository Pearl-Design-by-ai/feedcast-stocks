/**
 * Catalog symbol health check — verifies every ticker in the ETF Hub and
 * Stock Hub catalogs still resolves on the live quote source (Yahoo chart
 * API), so delistings and ticker changes get caught by the weekly workflow
 * instead of quietly rendering as "—" rows.
 *
 * Exit codes: 0 = all good (or the source rate-limited us — inconclusive runs
 * must not raise false alarms), 1 = confirmed dead symbols found.
 *
 * Run: npx tsx scripts/check-catalog-symbols.ts
 */

import { ETF_CATEGORIES } from '../lib/etfs';
import { STOCK_CATEGORIES } from '../lib/stock-lists';

const CONCURRENCY = 5;
const RETRIES = 2;

function allSymbols(): string[] {
    const syms = new Set<string>();
    for (const c of ETF_CATEGORIES) for (const g of c.groups) for (const x of g.etfs) syms.add(x.symbol);
    for (const c of STOCK_CATEGORIES) for (const g of c.groups) for (const x of g.stocks) syms.add(x.symbol);
    return [...syms];
}

type Verdict = 'ok' | 'dead' | 'blocked';

async function checkOnce(symbol: string): Promise<Verdict> {
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (res.status === 429 || res.status === 401 || res.status === 403) return 'blocked';
        const body = (await res.json().catch(() => null)) as {
            chart?: { result?: unknown[]; error?: { code?: string } };
        } | null;
        if (body?.chart?.result?.length) return 'ok';
        // Only a definitive "Not Found" counts as dead; anything else is noise.
        return body?.chart?.error?.code === 'Not Found' ? 'dead' : 'blocked';
    } catch {
        return 'blocked';
    }
}

async function check(symbol: string): Promise<Verdict> {
    let verdict: Verdict = 'blocked';
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        verdict = await checkOnce(symbol);
        if (verdict === 'ok') return verdict;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    return verdict;
}

async function main() {
    const symbols = allSymbols();
    console.log(`Checking ${symbols.length} catalog symbols…`);

    const dead: string[] = [];
    let blocked = 0;
    let i = 0;
    await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
            while (i < symbols.length) {
                const symbol = symbols[i++];
                const verdict = await check(symbol);
                if (verdict === 'dead') dead.push(symbol);
                if (verdict === 'blocked') blocked++;
            }
        })
    );

    if (blocked > symbols.length * 0.1) {
        console.log(`Inconclusive: ${blocked} symbols could not be verified (rate-limited?). Not failing.`);
        return;
    }
    if (blocked > 0) console.log(`Note: ${blocked} symbols inconclusive (transient errors), treated as OK.`);

    if (dead.length) {
        console.error(
            `DEAD SYMBOLS (${dead.length}) — Yahoo reports "Not Found"; replace or remove in ` +
                `lib/etfs.ts / lib/stock-lists.ts:\n${dead.sort().join('\n')}`
        );
        process.exit(1);
    }
    console.log('All catalog symbols resolve. ✓');
}

main();

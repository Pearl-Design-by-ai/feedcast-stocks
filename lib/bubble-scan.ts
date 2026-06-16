// Server orchestration for the Bubble Detector: fetch EOD closes for the whole
// universe (bounded pool, each symbol KV-cached 6h via fetchDailyCloses) and
// fold the per-asset scores into per-theme and overall readings.

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import {
    BUBBLE_THEMES,
    BUBBLE_CANDIDATES,
    ALL_BUBBLE_SYMBOLS,
    ALL_CANDIDATE_SYMBOLS,
    computeBubble,
    type AssetBubble,
    type BubbleTheme,
    type BubbleCandidate,
    type Phase,
} from '@/lib/bubble';

export interface ThemeScan {
    theme: BubbleTheme;
    assets: AssetBubble[];
    avgBubble: number;
    avgPop: number;
}

export interface CandidateScan {
    candidate: BubbleCandidate;
    assets: AssetBubble[];
    avgBubble: number;
    avgPop: number;
}

export interface BubbleScan {
    themes: ThemeScan[];
    candidates: CandidateScan[];
    /** Whole-universe average bubble score (0–100). */
    frothIndex: number;
    /** Top assets by pop risk across every theme. */
    topPop: AssetBubble[];
    /** How many of the speculative-theme assets actually returned live data. */
    scored: number;
    /** How many speculative-theme assets we tried to score. */
    universe: number;
    /** Count of scored theme assets in each phase (excludes broad market). */
    phaseCounts: Record<Phase, number>;
    asOf: string;
    /** Most recent close date in the underlying EOD data (YYYY-MM-DD). */
    dataDate: string;
}

async function fetchAll(symbols: string[]): Promise<{ assets: Map<string, AssetBubble>; dataDate: string }> {
    const out = new Map<string, AssetBubble>();
    let dataDate = '';
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            try {
                const series = await fetchDailyCloses(sym);
                const b = computeBubble(sym, series.map((c) => c.close));
                if (b) {
                    out.set(sym, b);
                    const d = series[series.length - 1]?.date;
                    if (d && d > dataDate) dataDate = d;
                }
            } catch {
                // One bad symbol shouldn't sink the scan.
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return { assets: out, dataDate };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export async function runBubbleScan(): Promise<BubbleScan> {
    // One fetch pass over the combined universe (themes + candidates); both
    // sections read from the same cached series.
    const universeSymbols = Array.from(
        new Set([...ALL_BUBBLE_SYMBOLS, ...ALL_CANDIDATE_SYMBOLS])
    );
    const { assets: data, dataDate } = await fetchAll(universeSymbols);

    const themes: ThemeScan[] = BUBBLE_THEMES.map((theme) => {
        const assets = theme.symbols
            .map((s) => data.get(s))
            .filter((a): a is AssetBubble => Boolean(a))
            .sort((a, b) => b.bubbleScore - a.bubbleScore);
        return {
            theme,
            assets,
            avgBubble: Math.round(avg(assets.map((a) => a.bubbleScore))),
            avgPop: Math.round(avg(assets.map((a) => a.popRisk))),
        };
    });

    const candidates: CandidateScan[] = BUBBLE_CANDIDATES.map((candidate) => {
        const assets = candidate.symbols
            .map((s) => data.get(s))
            .filter((a): a is AssetBubble => Boolean(a))
            .sort((a, b) => b.bubbleScore - a.bubbleScore);
        return {
            candidate,
            assets,
            avgBubble: Math.round(avg(assets.map((a) => a.bubbleScore))),
            avgPop: Math.round(avg(assets.map((a) => a.popRisk))),
        };
    });

    // Froth index excludes the Broad Market baseline so it reads as "theme
    // froth," not "is SPY up."
    const themeAssets = themes
        .filter((t) => t.theme.id !== 'broad')
        .flatMap((t) => t.assets);
    const frothIndex = Math.round(avg(themeAssets.map((a) => a.bubbleScore)));

    // Coverage + phase mix make the headline number honest: a low score
    // because the manias deflated looks very different from a low score
    // because the live feed only returned a few names.
    const universe = BUBBLE_THEMES.filter((t) => t.id !== 'broad').reduce(
        (n, t) => n + t.symbols.length,
        0
    );
    const phaseCounts: Record<Phase, number> = { calm: 0, inflating: 0, cracking: 0, popping: 0 };
    for (const a of themeAssets) phaseCounts[a.phase] += 1;
    const scored = themeAssets.length;

    // Up to 10 highest-pop-risk names across the whole universe; the page
    // shows 5 by default and lets the reader expand to all 10.
    const topPop = [...data.values()].sort((a, b) => b.popRisk - a.popRisk).slice(0, 10);

    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
    }).format(new Date());

    return { themes, candidates, frothIndex, topPop, scored, universe, phaseCounts, asOf, dataDate };
}

// Server orchestration for the Bubble Detector: fetch EOD closes for the whole
// universe (bounded pool, each symbol KV-cached 6h via fetchDailyCloses) and
// fold the per-asset scores into per-theme and overall readings.

import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import {
    BUBBLE_THEMES,
    ALL_BUBBLE_SYMBOLS,
    computeBubble,
    type AssetBubble,
    type BubbleTheme,
} from '@/lib/bubble';

export interface ThemeScan {
    theme: BubbleTheme;
    assets: AssetBubble[];
    avgBubble: number;
    avgPop: number;
}

export interface BubbleScan {
    themes: ThemeScan[];
    /** Whole-universe average bubble score (0–100). */
    frothIndex: number;
    /** Top assets by pop risk across every theme. */
    topPop: AssetBubble[];
    asOf: string;
}

async function fetchAll(symbols: string[]): Promise<Map<string, AssetBubble>> {
    const out = new Map<string, AssetBubble>();
    let next = 0;
    async function worker() {
        while (next < symbols.length) {
            const sym = symbols[next++];
            try {
                const series = await fetchDailyCloses(sym);
                const b = computeBubble(sym, series.map((c) => c.close));
                if (b) out.set(sym, b);
            } catch {
                // One bad symbol shouldn't sink the scan.
            }
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return out;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export async function runBubbleScan(): Promise<BubbleScan> {
    const data = await fetchAll(ALL_BUBBLE_SYMBOLS);

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

    // Froth index excludes the Broad Market baseline so it reads as "theme
    // froth," not "is SPY up."
    const themeAssets = themes
        .filter((t) => t.theme.id !== 'broad')
        .flatMap((t) => t.assets);
    const frothIndex = Math.round(avg(themeAssets.map((a) => a.bubbleScore)));

    const topPop = [...data.values()].sort((a, b) => b.popRisk - a.popRisk).slice(0, 5);

    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
    }).format(new Date());

    return { themes, frothIndex, topPop, asOf };
}

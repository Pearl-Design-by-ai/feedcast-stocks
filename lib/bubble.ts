/**
 * Bubble Detector — pure scoring + the theme catalog.
 *
 * The "where is the bubble" question is answered two ways here:
 *   1. A quantitative bubble/pop score computed from real EOD closes (no
 *      fabricated numbers) — see computeBubble().
 *   2. Curated editorial context per theme, grounded in mid-2026 research
 *      (sources listed on the page). Opinion, clearly framed as such.
 *
 * Everything is heuristic and informational — not advice. Bands are tuned to
 * read sensibly across calm ETFs and parabolic single names alike.
 */

export type Phase = 'calm' | 'inflating' | 'cracking' | 'popping';

export interface AssetBubble {
    symbol: string;
    last: number;
    ext200: number | null; // % above the 200-day average
    ret1Y: number | null;
    ret3M: number | null;
    ret1M: number | null;
    offHigh: number | null; // % from the 52-week high (≤ 0)
    rsi: number | null;
    vol: number | null; // 20d realized, annualized %
    limitedHistory: boolean; // < ~1y of data (recent IPO/listing)
    bubbleScore: number; // 0–100, how inflated
    popRisk: number; // 0–100, how fragile / actively deflating
    phase: Phase;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Compute the bubble profile for one daily-close series. null when too short. */
export function computeBubble(symbol: string, closes: number[]): AssetBubble | null {
    const n = closes.length;
    if (n < 40) return null;

    const last = closes[n - 1];
    const at = (back: number) => (n - 1 - back >= 0 ? closes[n - 1 - back] : undefined);
    const pct = (past: number | undefined) => (past && past > 0 ? (last / past - 1) * 100 : null);

    const sma = (k: number): number | null => {
        if (n < k) return null;
        let s = 0;
        for (let i = n - k; i < n; i++) s += closes[i];
        return s / k;
    };
    const sma50 = sma(50);
    const sma200 = sma(200);

    const win52 = closes.slice(-252);
    const high52 = Math.max(...win52);
    const offHigh = high52 > 0 ? (last / high52 - 1) * 100 : null;

    const ext200 = sma200 ? (last / sma200 - 1) * 100 : null;
    const ret1Y = pct(at(252));
    const ret3M = pct(at(63));
    const ret1M = pct(at(21));
    const retAll = pct(closes[0]); // since first available close — for short histories
    const limitedHistory = n < 252;

    // RSI(14), Wilder-smoothed.
    let rsi: number | null = null;
    if (n >= 15) {
        let g = 0;
        let l = 0;
        for (let i = 1; i <= 14; i++) {
            const d = closes[i] - closes[i - 1];
            if (d >= 0) g += d;
            else l -= d;
        }
        let ag = g / 14;
        let al = l / 14;
        for (let i = 15; i < n; i++) {
            const d = closes[i] - closes[i - 1];
            ag = (ag * 13 + Math.max(d, 0)) / 14;
            al = (al * 13 + Math.max(-d, 0)) / 14;
        }
        rsi = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    }

    // 20d realized vol, annualized.
    let vol: number | null = null;
    if (n >= 21) {
        const rets: number[] = [];
        for (let i = n - 20; i < n; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
        const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
        vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
    }

    // --- Bubble score (how inflated) ---
    // Extension above trend; fall back to 3-month parabolicity when there's no
    // 200-day history yet (the frothiest names are often the newest).
    const extScore =
        ext200 != null
            ? clamp((ext200 / 50) * 100, 0, 100)
            : ret3M != null
              ? clamp((ret3M / 40) * 100, 0, 100)
              : 0;
    // Run-up; fall back to since-listing return for short histories.
    const runBasis = ret1Y ?? retAll;
    const runScore = runBasis != null ? clamp((runBasis / 150) * 100, 0, 100) : 0;
    const rsiScore = rsi != null ? clamp(((rsi - 50) / 30) * 100, 0, 100) : 0;
    // Proximity to the 52-week high: at the high = 100, 20%+ off = 0.
    const highScore = offHigh != null ? clamp(((20 + offHigh) / 20) * 100, 0, 100) : 50;

    const bubbleScore = Math.round(
        0.35 * extScore + 0.3 * runScore + 0.2 * rsiScore + 0.15 * highScore
    );

    // --- Pop risk (fragility × active deflation triggers) ---
    const below50 = sma50 != null && last < sma50;
    const mom1mNeg = ret1M != null && ret1M < 0;
    const deflating = offHigh != null && offHigh <= -8;
    const volHot = vol != null && vol > 60;
    const trigger =
        (below50 ? 0.3 : 0) + (mom1mNeg ? 0.25 : 0) + (deflating ? 0.3 : 0) + (volHot ? 0.15 : 0);
    const popRisk = Math.round(bubbleScore * (0.45 + 0.55 * Math.min(1, trigger)));

    let phase: Phase;
    if (bubbleScore < 30) phase = 'calm';
    else if (offHigh != null && offHigh <= -20) phase = 'popping';
    else if (below50 || mom1mNeg) phase = 'cracking';
    else phase = 'inflating';

    return {
        symbol,
        last,
        ext200,
        ret1Y,
        ret3M,
        ret1M,
        offHigh,
        rsi,
        vol,
        limitedHistory,
        bubbleScore,
        popRisk,
        phase,
    };
}

export function bubbleBand(score: number): { label: string; tone: 'pos' | 'warn' | 'neg' } {
    if (score >= 75) return { label: 'Bubble territory', tone: 'neg' };
    if (score >= 55) return { label: 'Frothy', tone: 'warn' };
    if (score >= 30) return { label: 'Elevated', tone: 'warn' };
    return { label: 'Calm', tone: 'pos' };
}

export const PHASE_LABEL: Record<Phase, string> = {
    calm: 'No bubble',
    inflating: 'Inflating',
    cracking: 'Cracking',
    popping: 'Deflating',
};

export const PHASE_TONE: Record<Phase, 'pos' | 'warn' | 'neg'> = {
    calm: 'pos',
    inflating: 'neg',
    cracking: 'warn',
    popping: 'warn',
};

// --- Theme catalog ---------------------------------------------------------

export interface BubbleTheme {
    id: string;
    label: string;
    /** One-line framing. */
    tagline: string;
    /** Curated "why this could be a bubble" — editorial, mid-2026 research. */
    why: string;
    symbols: string[];
    /** Static accent classes. */
    text: string;
    chip: string;
    bar: string;
}

export const BUBBLE_THEMES: BubbleTheme[] = [
    {
        id: 'quantum',
        label: 'Quantum Computing',
        tagline: 'The board’s clearest speculative mania.',
        why: 'Price-to-sales ratios run from ~146× (IONQ) to ~2,990× (QUBT) after rallies of up to ~3,000% since late 2024 — while practical, cost-competitive quantum advantage is still widely seen as years away. Multiple analysts single this group out as the bubble most likely to burst in 2026.',
        symbols: ['IONQ', 'RGTI', 'QBTS', 'QUBT'],
        text: 'text-fuchsia-400',
        chip: 'bg-fuchsia-400/10 text-fuchsia-400',
        bar: 'bg-fuchsia-400',
    },
    {
        id: 'metals',
        label: 'Precious Metals',
        tagline: 'Overbought — but backed by real deficits.',
        why: 'Since end-2024: gold +65%, silver +170%, platinum +150%, palladium +95%, with 50+ all-time highs. Silver pushed weekly RSI above 70 and a SocGen quant model flagged bubble-like behavior — yet 200M+ oz annual supply deficits and heavy central-bank buying mean this looks more "overbought" than purely speculative.',
        symbols: ['GLD', 'SLV', 'PPLT', 'PALL', 'SIL'],
        text: 'text-amber-400',
        chip: 'bg-amber-400/10 text-amber-400',
        bar: 'bg-amber-400',
    },
    {
        id: 'ai',
        label: 'AI & Semiconductors',
        tagline: 'A real technology at frothy prices.',
        why: 'AI has lifted the S&P and tech well above historical-average valuations; GMO calls it an "extreme bubble," and at least one research firm projects an AI-led crash in 2026 with 20–50% downside for leaders. The technology is real — the question is the price.',
        symbols: ['NVDA', 'AVGO', 'AMD', 'PLTR', 'SMCI'],
        text: 'text-violet-400',
        chip: 'bg-violet-400/10 text-violet-400',
        bar: 'bg-violet-400',
    },
    {
        id: 'crypto',
        label: 'Crypto-Linked Equities',
        tagline: 'Leveraged bets on the bitcoin cycle.',
        why: 'MicroStrategy (MSTR) is down ~75% from its 2024 peak yet still called grossly overvalued on its debt-funded bitcoin strategy. The whole complex amplifies bitcoin’s "speculative mania vs. strategic allocation" debate.',
        symbols: ['MSTR', 'COIN', 'MARA', 'IBIT'],
        text: 'text-orange-400',
        chip: 'bg-orange-400/10 text-orange-400',
        bar: 'bg-orange-400',
    },
    {
        id: 'nuclear',
        label: 'Nuclear & Uranium',
        tagline: 'A slow real story at fast prices.',
        why: 'Small-modular-reactor names (SMR, OKLO) carry sky-high valuations "with the feel of a bubble" on a genuine but slow-moving nuclear-demand thesis; uranium broadly (URA, CCJ) has re-rated hard.',
        symbols: ['URA', 'CCJ', 'SMR', 'OKLO'],
        text: 'text-emerald-400',
        chip: 'bg-emerald-400/10 text-emerald-400',
        bar: 'bg-emerald-400',
    },
    {
        id: 'speculative',
        label: 'Speculative Growth',
        tagline: 'The high-beta canary.',
        why: 'Innovation baskets (ARKK, ARKG) hold long-duration, high-beta growth — they tend to amplify whatever the speculative regime is doing, so they’re an early read on risk appetite turning.',
        symbols: ['ARKK', 'ARKG'],
        text: 'text-rose-400',
        chip: 'bg-rose-400/10 text-rose-400',
        bar: 'bg-rose-400',
    },
    {
        id: 'broad',
        label: 'Broad Market',
        tagline: 'Not a bubble — but it inherits the froth.',
        why: 'The index itself isn’t a bubble, but record concentration in a handful of AI mega-caps means the S&P and Nasdaq inherit their valuations. This is the baseline to judge every other theme against.',
        symbols: ['SPY', 'QQQ'],
        text: 'text-sky-400',
        chip: 'bg-sky-400/10 text-sky-400',
        bar: 'bg-sky-400',
    },
];

export const ALL_BUBBLE_SYMBOLS: string[] = Array.from(
    new Set(BUBBLE_THEMES.flatMap((t) => t.symbols))
);

// --- Historical bubbles (educational context) ------------------------------
// Well-documented past manias. Drawdowns are peak-to-trough, rounded. These
// are the patterns the live detector is built to catch: parabolic price far
// above trend, euphoric momentum, then the roll-over.

export interface HistoricalBubble {
    name: string;
    era: string;
    /** Peak-to-trough decline, as a display string. */
    drawdown: string;
    /** Numeric drawdown magnitude (for the bar), 0–100. */
    drawdownPct: number;
    window: string;
    /** The tell at the top — what marked it as a bubble. */
    tell: string;
    /** What it teaches about today. */
    lesson: string;
}

export const HISTORICAL_BUBBLES: HistoricalBubble[] = [
    {
        name: 'Tulip Mania',
        era: '1637 · Netherlands',
        drawdown: '~−90%',
        drawdownPct: 90,
        window: 'Months',
        tell: 'A single rare bulb traded for ~10× a craftsman’s annual wage.',
        lesson: 'The first recorded bubble — price detached entirely from any use value, then buyers simply vanished.',
    },
    {
        name: 'Wall Street Crash',
        era: '1929 · USA',
        drawdown: '−89%',
        drawdownPct: 89,
        window: 'Sep 1929 – Jul 1932',
        tell: 'Stocks bought on 90% margin; everyone was "in the market."',
        lesson: 'Leverage turns a correction into a wipeout — and recovery took 25 years.',
    },
    {
        name: 'Japan / Nikkei',
        era: '1989 · Japan',
        drawdown: '−82%',
        drawdownPct: 82,
        window: '1989 – 2009',
        tell: 'Tokyo land was "worth more than all of California"; P/E near 60×.',
        lesson: 'Even great economies can stay deflated for decades after a valuation bubble.',
    },
    {
        name: 'Dot-Com / Nasdaq',
        era: '2000 · USA',
        drawdown: '−78%',
        drawdownPct: 78,
        window: 'Mar 2000 – Oct 2002',
        tell: 'Profitless "eyeballs" stories; price-to-sales in the hundreds.',
        lesson: 'A real, transformative technology can still be wildly overpriced — the echo today is AI.',
    },
    {
        name: 'Housing & Financials',
        era: '2008 · Global',
        drawdown: '−57% S&P',
        drawdownPct: 57,
        window: 'Oct 2007 – Mar 2009',
        tell: 'Subprime leverage layered through the whole banking system.',
        lesson: 'Credit stress is the real detonator — watch where the borrowing is hiding.',
    },
    {
        name: 'Silver (Hunt Bros.)',
        era: '1980 · USA',
        drawdown: '−90%',
        drawdownPct: 90,
        window: '1980 (≈2 months)',
        tell: 'Two brothers cornered silver on margin; price ran to ~$50/oz.',
        lesson: 'A margin call on "Silver Thursday" ended it overnight — the relevant rhyme for today’s metals.',
    },
    {
        name: 'Bitcoin (2017)',
        era: '2017 · Crypto',
        drawdown: '−84%',
        drawdownPct: 84,
        window: 'Dec 2017 – Dec 2018',
        tell: 'ICO mania; ~$20k peak on pure retail FOMO.',
        lesson: 'Crypto bubbles deflate ~80%+ — and have done it repeatedly.',
    },
    {
        name: 'ARKK / Spec. Growth',
        era: '2021 · USA',
        drawdown: '−81%',
        drawdownPct: 81,
        window: 'Feb 2021 – Dec 2022',
        tell: 'Profitless hyper-growth at 20–40× sales as rates sat at zero.',
        lesson: 'When the cost of money rises, the longest-duration bets fall hardest.',
    },
];

export interface BubbleSource {
    label: string;
    url: string;
}

/** Research the editorial context draws on (shown on the page). */
export const BUBBLE_SOURCES: BubbleSource[] = [
    { label: 'GMO — Valuing AI: Extreme Bubble or New Golden Era', url: 'https://www.gmo.com/americas/research-library/valuing-ai-extreme-bubble-new-golden-era-or-both_viewpoints/' },
    { label: 'Motley Fool — Quantum Computing Bubble Will Burst in 2026', url: 'https://www.fool.com/investing/2025/12/14/2-quantum-stocks-crash-2026-market-bubble-burst/' },
    { label: 'TradingView/Invezz — Is the gold and silver rally a bubble?', url: 'https://www.tradingview.com/news/invezz:49a991683094b:0-is-the-gold-and-silver-rally-a-bubble-what-2026-could-mean-for-bullion/' },
    { label: 'Seeking Alpha — Strategy (MSTR) Still Grossly Overvalued', url: 'https://seekingalpha.com/article/4872925-strategy-dont-buy-the-perilous-dip-still-grossly-overvalued' },
    { label: 'Nasdaq — 2026: Year of the Bubble', url: 'https://www.nasdaq.com/articles/prediction-2026-will-be-known-year-bubble-wall-street' },
];

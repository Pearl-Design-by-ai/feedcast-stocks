/**
 * Curated market-history context for the Buy & Sell Signals page:
 *   - typical drawdown → recovery statistics (how long corrections take to heal)
 *   - the fundamental case for why US equities rise over the long run
 *
 * Historical figures are well-documented long-run averages for the S&P 500
 * (Shiller/NBER/Ned Davis-style stats), presented as reference — every cycle
 * differs. Educational, not advice.
 */

export interface DrawdownStat {
    band: string;
    frequency: string;
    avgDecline: string;
    recovery: string;
    note: string;
    /** Tone for the row. */
    tone: 'pos' | 'neutral' | 'warn' | 'neg';
}

/** S&P 500 drawdown buckets with average decline + time to recover the prior peak. */
export const CORRECTION_STATS: DrawdownStat[] = [
    { band: 'Pullback · −5% to −10%', frequency: '≈ once or twice a year', avgDecline: '≈ −7%', recovery: '≈ 1–2 months', note: 'Routine noise inside an uptrend — usually bought back fast.', tone: 'pos' },
    { band: 'Correction · −10% to −20%', frequency: '≈ once every 1–2 years', avgDecline: '≈ −14%', recovery: '≈ 4 months (range 2–8)', note: 'A healthy reset; most resolve quickly without a recession.', tone: 'neutral' },
    { band: 'Bear market · −20% to −40%', frequency: '≈ once a decade', avgDecline: '≈ −33%', recovery: '≈ 2 years (peak-to-peak)', note: 'Usually tied to a recession; the low tends to form ~13 months in.', tone: 'warn' },
    { band: 'Severe bear · −40%+', frequency: 'rare — 1929, 1973, 2000, 2008', avgDecline: '≈ −49%', recovery: '≈ 4+ years', note: 'Structural or credit crises — the painful tail of the distribution.', tone: 'neg' },
];

/** Map a drawdown magnitude (positive %) to the historical recovery estimate. */
export function recoveryForDrawdown(magnitudePct: number): string {
    const d = Math.abs(magnitudePct);
    if (d < 10) return '≈ 1–2 months';
    if (d < 20) return '≈ 4 months (2–8)';
    if (d < 30) return '≈ 1–2 years';
    return '≈ 2–4 years';
}

export interface WhyUp {
    title: string;
    body: string;
}

/** The fundamental long-run case, with concrete examples. */
export const WHY_MARKETS_RISE: WhyUp[] = [
    {
        title: 'Earnings are the engine',
        body: 'Over time prices track profits. S&P 500 earnings per share have climbed from a few dollars in the 1950s to well over $200 today — a ~6–7%/yr rise that prices simply follow. Buy the index and you own a growing stream of corporate profits, not a static asset.',
    },
    {
        title: 'Compounding & reinvestment',
        body: 'Companies reinvest profits at high returns and return the rest via dividends and buybacks. $1 in the S&P in 1928 is worth a few hundred on price alone — but tens of thousands with dividends reinvested. Most of the long-run return is compounding, not richer valuations.',
    },
    {
        title: 'A self-renewing index',
        body: 'The index isn\'t fixed — it sheds laggards and adds winners. Railroads → autos → oil → computing → the internet → AI. Each era\'s productivity leaders replace the last (only a handful of the original Dow names survive), so the index captures progress itself.',
    },
    {
        title: 'Stocks are real (nominal) assets',
        body: 'Revenues and profits are quoted in nominal dollars, so they rise with inflation and real growth. US nominal GDP has compounded ~6%/yr for a century; equities ride that same tide. It\'s why cash erodes and stocks win over decades.',
    },
    {
        title: 'Structural tailwinds',
        body: 'Population and immigration growth, the rule of law, the world\'s deepest and most liquid capital markets, the dollar\'s reserve status, and a culture of risk-taking keep capital and talent flowing to US companies.',
    },
    {
        title: 'Time in the market beats timing',
        body: 'The S&P has finished positive in ~73% of years and nearly 100% of rolling 20-year periods. Drawdowns are frequent but temporary; the trend is up because earnings keep growing. As Buffett put it: "Never bet against America."',
    },
];

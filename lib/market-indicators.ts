// Catalog of the 40 market indicators surfaced under /market-indicators.
//
// Every indicator renders through a TradingView embed widget — either the
// Advanced Real-Time Chart (a symbol plus optional built-in studies) or, for
// the survey-based indices that TradingView does not carry (AAII, NAAIM, CNN
// Fear & Greed), an info card that links out to the official source.
//
// Symbol notes:
//   SP:SPX / NASDAQ:NDX  — cash indices (no volume, so volume studies use ETFs)
//   AMEX:SPY / AMEX:RSP  — ETFs, used wherever a study needs real volume
//   TVC:*                — TradingView macro feeds (VIX, yields)
//   USI:*                — breadth / sentiment internals (S5FI, NYMO, PCC, …)
//   FRED:*               — Federal Reserve series (yield curve, credit spreads)
//   "A/B" expressions    — ratio charts (relative strength, equal- vs cap-weight)

export type TVStudy = string | { id: string; inputs?: Record<string, unknown> };

export type IndicatorWidget =
    | { kind: 'chart'; symbol: string; studies?: TVStudy[]; interval?: string }
    | { kind: 'external'; source: string; url: string };

export interface MarketIndicator {
    num: number;
    name: string;
    blurb: string;
    widget: IndicatorWidget;
}

export interface IndicatorCategory {
    id: string;
    label: string;
    blurb: string;
    indicators: MarketIndicator[];
}

const chart = (
    symbol: string,
    studies: TVStudy[] = [],
    interval = 'D'
): IndicatorWidget => ({ kind: 'chart', symbol, studies, interval });

const external = (source: string, url: string): IndicatorWidget => ({
    kind: 'external',
    source,
    url,
});

// Common base symbols
const SPX = 'SP:SPX';
const NDX = 'NASDAQ:NDX';
const SPY = 'AMEX:SPY'; // ETF proxy when a study needs volume

export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
    {
        id: 'trend',
        label: 'Trend',
        blurb: 'Direction and strength of the primary market trend.',
        indicators: [
            {
                num: 1,
                name: 'S&P 500 vs 200DMA',
                blurb: 'Price above the 200-day average = long-term uptrend; below = downtrend.',
                widget: chart(SPX, [{ id: 'MASimple@tv-basicstudies', inputs: { length: 200 } }]),
            },
            {
                num: 2,
                name: 'Nasdaq 100 vs 200DMA',
                blurb: 'Growth/tech leadership gauge against its 200-day trend line.',
                widget: chart(NDX, [{ id: 'MASimple@tv-basicstudies', inputs: { length: 200 } }]),
            },
            {
                num: 3,
                name: '50DMA vs 200DMA (Golden / Death Cross)',
                blurb: '50-day crossing above the 200-day is bullish (golden cross); below is bearish (death cross).',
                widget: chart(SPX, [
                    { id: 'MASimple@tv-basicstudies', inputs: { length: 50 } },
                    { id: 'MASimple@tv-basicstudies', inputs: { length: 200 } },
                ]),
            },
            {
                num: 4,
                name: 'MACD',
                blurb: 'Moving-average convergence/divergence — momentum behind the trend; signal-line crossovers flag shifts.',
                widget: chart(SPX, ['MACD@tv-basicstudies']),
            },
            {
                num: 5,
                name: 'ADX',
                blurb: 'Average Directional Index — trend strength regardless of direction; >25 = strong trend.',
                widget: chart(SPX, ['ADX@tv-basicstudies']),
            },
            {
                num: 6,
                name: 'Relative Strength vs Benchmark',
                blurb: 'Nasdaq 100 ÷ S&P 500 ratio. Rising = growth leadership; falling = broad-market/defensive leadership.',
                widget: chart(`${NDX}/${SPX}`),
            },
            {
                num: 7,
                name: 'Ichimoku Cloud',
                blurb: 'Price above the cloud = uptrend, below = downtrend; the cloud projects support/resistance.',
                widget: chart(SPX, ['IchimokuCloud@tv-basicstudies']),
            },
            {
                num: 8,
                name: 'Trend Slope (Linear Regression)',
                blurb: 'Linear-regression channel — slope direction and steepness quantify the prevailing trend.',
                widget: chart(SPX, ['LinearRegression@tv-basicstudies']),
            },
        ],
    },
    {
        id: 'momentum',
        label: 'Momentum',
        blurb: 'How fast and how stretched the move is — overbought / oversold extremes.',
        indicators: [
            {
                num: 9,
                name: 'RSI (14)',
                blurb: 'Relative Strength Index — >70 overbought, <30 oversold over a 14-period lookback.',
                widget: chart(SPX, [{ id: 'RSI@tv-basicstudies', inputs: { length: 14 } }]),
            },
            {
                num: 10,
                name: 'RSI (2)',
                blurb: 'Short-term mean-reversion gauge — fast RSI for timing pullbacks and bounces.',
                widget: chart(SPX, [{ id: 'RSI@tv-basicstudies', inputs: { length: 2 } }]),
            },
            {
                num: 11,
                name: 'Stochastic RSI',
                blurb: 'RSI run through a stochastic — a more sensitive overbought/oversold oscillator.',
                widget: chart(SPX, ['StochasticRSI@tv-basicstudies']),
            },
            {
                num: 12,
                name: 'Rate of Change (ROC)',
                blurb: 'Percent change over N periods — raw momentum; zero-line crosses flag acceleration.',
                widget: chart(SPX, ['ROC@tv-basicstudies']),
            },
            {
                num: 13,
                name: 'CCI',
                blurb: 'Commodity Channel Index — distance from the average; ±100 marks trend strength / extremes.',
                widget: chart(SPX, ['CCI@tv-basicstudies']),
            },
            {
                num: 14,
                name: 'Williams %R',
                blurb: 'Where price sits in its recent range — −20 overbought, −80 oversold.',
                widget: chart(SPX, ['WilliamR@tv-basicstudies']),
            },
        ],
    },
    {
        id: 'volume-flow',
        label: 'Volume & Institutional Flow',
        blurb: 'Whether volume confirms the move and where the smart money is flowing. (Uses SPY for real volume.)',
        indicators: [
            {
                num: 15,
                name: 'On Balance Volume (OBV)',
                blurb: 'Cumulative volume by up/down days — confirms trends or warns via divergence.',
                widget: chart(SPY, ['OBV@tv-basicstudies']),
            },
            {
                num: 16,
                name: 'Chaikin Money Flow (CMF)',
                blurb: 'Buying vs selling pressure over ~21 days; above zero = accumulation.',
                widget: chart(SPY, ['ChaikinMoneyFlow@tv-basicstudies']),
            },
            {
                num: 17,
                name: 'Money Flow Index (MFI)',
                blurb: 'Volume-weighted RSI — overbought >80 / oversold <20 with flow confirmation.',
                widget: chart(SPY, ['MoneyFlowIndex@tv-basicstudies']),
            },
            {
                num: 18,
                name: 'VWAP',
                blurb: 'Volume-weighted average price — the session’s fair-value line institutions trade around.',
                widget: chart(SPY, ['VWAP@tv-basicstudies'], '60'),
            },
            {
                num: 19,
                name: 'Relative Volume',
                blurb: 'Today’s volume vs its typical level — spikes flag conviction behind a move.',
                widget: chart(SPY, ['RelativeVolume@tv-basicstudies']),
            },
            {
                num: 20,
                name: 'Accumulation / Distribution Line',
                blurb: 'Cumulative flow weighted by close location in range — tracks accumulation vs distribution.',
                widget: chart(SPY, ['AccumulationDistribution@tv-basicstudies']),
            },
        ],
    },
    {
        id: 'volatility',
        label: 'Volatility',
        blurb: 'How much the market is moving and how much fear is priced in.',
        indicators: [
            {
                num: 21,
                name: 'VIX',
                blurb: 'CBOE Volatility Index — expected 30-day S&P volatility; spikes mark fear/risk-off.',
                widget: chart('TVC:VIX'),
            },
            {
                num: 22,
                name: 'VVIX',
                blurb: 'Volatility of the VIX — stress in the options market itself; the “fear of fear.”',
                widget: chart('CBOE:VVIX'),
            },
            {
                num: 23,
                name: 'ATR',
                blurb: 'Average True Range — typical daily move in points; sizing and stop-distance gauge.',
                widget: chart(SPX, ['ATR@tv-basicstudies']),
            },
            {
                num: 24,
                name: 'Bollinger Band Width',
                blurb: 'Band width = volatility regime; squeezes (narrow) often precede big moves.',
                widget: chart(SPX, ['BollingerBandsWidth@tv-basicstudies']),
            },
            {
                num: 25,
                name: 'Historical Volatility',
                blurb: 'Realized (backward-looking) volatility — compare with VIX to see if fear is rich or cheap.',
                widget: chart(SPX, ['HistoricalVolatility@tv-basicstudies']),
            },
        ],
    },
    {
        id: 'breadth',
        label: 'Market Breadth',
        blurb: 'How many stocks participate — narrow leadership warns of fragile rallies.',
        indicators: [
            {
                num: 26,
                name: 'Advance / Decline Line',
                blurb: 'Net advancing vs declining issues — confirms (or diverges from) the index trend.',
                widget: chart('USI:ADD'),
            },
            {
                num: 27,
                name: 'McClellan Oscillator',
                blurb: 'Breadth momentum from NYSE advances/declines; zero-line crosses flag breadth shifts.',
                widget: chart('USI:NYMO'),
            },
            {
                num: 28,
                name: '% Stocks Above 50DMA',
                blurb: 'Share of S&P 500 names above their 50-day average — short-term participation.',
                widget: chart('USI:S5FI'),
            },
            {
                num: 29,
                name: '% Stocks Above 200DMA',
                blurb: 'Share of S&P 500 names above their 200-day average — long-term participation/health.',
                widget: chart('USI:S5TH'),
            },
            {
                num: 30,
                name: 'New Highs / New Lows',
                blurb: 'NYSE net new 52-week highs — expansion = healthy trend, contraction = deterioration.',
                widget: chart('USI:MAHN'),
            },
            {
                num: 31,
                name: 'Equal Weight vs Cap Weight S&P',
                blurb: 'RSP ÷ SPY — rising = broad participation; falling = a handful of megacaps carrying the index.',
                widget: chart('AMEX:RSP/AMEX:SPY'),
            },
        ],
    },
    {
        id: 'sentiment',
        label: 'Sentiment',
        blurb: 'Crowd positioning and mood — often a contrarian tell at extremes.',
        indicators: [
            {
                num: 32,
                name: 'Put / Call Ratio',
                blurb: 'Total options put/call — high = fearful (often a bottom), low = complacent (often a top).',
                widget: chart('USI:PCC'),
            },
            {
                num: 33,
                name: 'AAII Bull / Bear Survey',
                blurb: 'Weekly retail-investor sentiment survey; extremes are a classic contrarian signal.',
                widget: external('AAII', 'https://www.aaii.com/sentimentsurvey'),
            },
            {
                num: 34,
                name: 'NAAIM Exposure Index',
                blurb: 'How long/short active managers actually are — real positioning, not just opinion.',
                widget: external('NAAIM', 'https://naaim.org/programs/naaim-exposure-index/'),
            },
            {
                num: 35,
                name: 'CNN Fear & Greed Index',
                blurb: 'Composite of 7 market-emotion gauges on a 0 (extreme fear) – 100 (extreme greed) scale.',
                widget: external('CNN', 'https://www.cnn.com/markets/fear-and-greed'),
            },
        ],
    },
    {
        id: 'rates-credit',
        label: 'Interest Rates & Credit',
        blurb: 'The macro backdrop — yields and credit stress that drive risk appetite.',
        indicators: [
            {
                num: 36,
                name: 'US 2-Year Treasury Yield',
                blurb: 'Short end — tracks Fed-policy expectations most closely.',
                widget: chart('TVC:US02Y'),
            },
            {
                num: 37,
                name: 'US 10-Year Treasury Yield',
                blurb: 'The global benchmark rate — discounts growth, inflation and risk premia.',
                widget: chart('TVC:US10Y'),
            },
            {
                num: 38,
                name: '10Y – 2Y Yield Curve',
                blurb: 'Curve spread; sustained inversion (below zero) has preceded most recessions.',
                widget: chart('FRED:T10Y2Y'),
            },
            {
                num: 39,
                name: 'High Yield Credit Spread',
                blurb: 'Junk-bond spread over Treasuries — widening = rising default fear / risk-off.',
                widget: chart('FRED:BAMLH0A0HYM2'),
            },
            {
                num: 40,
                name: 'Investment Grade Credit Spread',
                blurb: 'IG corporate spread — a calmer credit-stress gauge; widening flags caution.',
                widget: chart('FRED:BAMLC0A0CM'),
            },
        ],
    },
];

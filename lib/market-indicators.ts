// Catalog of the 40 market indicators surfaced under /market-indicators.
//
// Every indicator renders through a TradingView embed widget — either the
// Advanced Real-Time Chart (a symbol plus optional built-in studies / a
// compare overlay) or, for series the free embed cannot display, an info card
// that links out to the source ("Open on TradingView", AAII, NAAIM, CNN).
//
// Why ETFs instead of the cash indices: the embedded (free) TradingView widget
// raises a "This symbol is only available on TradingView" prompt for some
// gated index feeds and for any calculated symbol (ratios/spreads). Liquid
// ETFs (SPY/QQQ/RSP) always render delayed with no prompt and track the index
// closely, and they carry real volume so volume studies work on the same base.
//
// Symbol notes:
//   AMEX:SPY / NASDAQ:QQQ / AMEX:RSP — ETF proxies for S&P 500 / Nasdaq 100 / equal-weight S&P
//   TVC:*   — TradingView free macro feeds (VIX, Treasury yields)
//   FRED:*  — Federal Reserve series (yield curve, credit spreads)
//   external — breadth/sentiment internals the free embed won't draw → link out

export type TVStudy = string | { id: string; inputs?: Record<string, unknown> };

export type IndicatorWidget =
    | {
          kind: 'chart';
          symbol: string;
          studies?: TVStudy[];
          interval?: string;
          compareSymbols?: Array<{ symbol: string; position: string }>;
      }
    | { kind: 'external'; source: string; url: string; note?: string };

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
    interval = 'D',
    compareSymbols: Array<{ symbol: string; position: string }> = []
): IndicatorWidget => ({ kind: 'chart', symbol, studies, interval, compareSymbols });

const external = (source: string, url: string, note?: string): IndicatorWidget => ({
    kind: 'external',
    source,
    url,
    note,
});

// Link to a symbol's full TradingView chart (used for feeds the free embed
// won't render inline — breadth internals, put/call, VVIX, …).
const tvChart = (symbol: string, note?: string): IndicatorWidget =>
    external('TradingView', `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`, note);

// ETF proxies — embed-safe, carry volume, track the index closely.
const SPY = 'AMEX:SPY'; // S&P 500
const QQQ = 'NASDAQ:QQQ'; // Nasdaq 100

export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
    {
        id: 'trend',
        label: 'Trend',
        blurb: 'Direction and strength of the primary market trend.',
        indicators: [
            {
                num: 1,
                name: 'S&P 500 vs 200DMA',
                blurb: 'Price above the 200-day average = long-term uptrend; below = downtrend. (S&P 500 via SPY.)',
                widget: chart(SPY, [{ id: 'MASimple@tv-basicstudies', inputs: { length: 200 } }]),
            },
            {
                num: 2,
                name: 'Nasdaq 100 vs 200DMA',
                blurb: 'Growth/tech leadership gauge against its 200-day trend line. (Nasdaq 100 via QQQ.)',
                widget: chart(QQQ, [{ id: 'MASimple@tv-basicstudies', inputs: { length: 200 } }]),
            },
            {
                num: 3,
                name: '50DMA vs 200DMA (Golden / Death Cross)',
                blurb: '50-day crossing above the 200-day is bullish (golden cross); below is bearish (death cross).',
                widget: chart(SPY, [
                    { id: 'MASimple@tv-basicstudies', inputs: { length: 50 } },
                    { id: 'MASimple@tv-basicstudies', inputs: { length: 200 } },
                ]),
            },
            {
                num: 4,
                name: 'MACD',
                blurb: 'Moving-average convergence/divergence — momentum behind the trend; signal-line crossovers flag shifts.',
                widget: chart(SPY, ['MACD@tv-basicstudies']),
            },
            {
                num: 5,
                name: 'ADX',
                blurb: 'Average Directional Index — trend strength regardless of direction; >25 = strong trend.',
                widget: chart(SPY, ['ADX@tv-basicstudies']),
            },
            {
                num: 6,
                name: 'Relative Strength vs Benchmark',
                blurb: 'Nasdaq 100 (QQQ) overlaid on the S&P 500 (SPY). QQQ pulling ahead = growth leadership; lagging = broad/defensive leadership.',
                widget: chart(QQQ, [], 'D', [{ symbol: SPY, position: 'SameScale' }]),
            },
            {
                num: 7,
                name: 'Ichimoku Cloud',
                blurb: 'Price above the cloud = uptrend, below = downtrend; the cloud projects support/resistance.',
                widget: chart(SPY, ['IchimokuCloud@tv-basicstudies']),
            },
            {
                num: 8,
                name: 'Trend Slope (Linear Regression)',
                blurb: 'Linear-regression channel — slope direction and steepness quantify the prevailing trend.',
                widget: chart(SPY, ['LinearRegression@tv-basicstudies']),
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
                widget: chart(SPY, [{ id: 'RSI@tv-basicstudies', inputs: { length: 14 } }]),
            },
            {
                num: 10,
                name: 'RSI (2)',
                blurb: 'Short-term mean-reversion gauge — fast RSI for timing pullbacks and bounces.',
                widget: chart(SPY, [{ id: 'RSI@tv-basicstudies', inputs: { length: 2 } }]),
            },
            {
                num: 11,
                name: 'Stochastic RSI',
                blurb: 'RSI run through a stochastic — a more sensitive overbought/oversold oscillator.',
                widget: chart(SPY, ['StochasticRSI@tv-basicstudies']),
            },
            {
                num: 12,
                name: 'Rate of Change (ROC)',
                blurb: 'Percent change over N periods — raw momentum; zero-line crosses flag acceleration.',
                widget: chart(SPY, ['ROC@tv-basicstudies']),
            },
            {
                num: 13,
                name: 'CCI',
                blurb: 'Commodity Channel Index — distance from the average; ±100 marks trend strength / extremes.',
                widget: chart(SPY, ['CCI@tv-basicstudies']),
            },
            {
                num: 14,
                name: 'Williams %R',
                blurb: 'Where price sits in its recent range — −20 overbought, −80 oversold.',
                widget: chart(SPY, ['WilliamR@tv-basicstudies']),
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
                widget: tvChart('TVC:VIX'),
            },
            {
                num: 22,
                name: 'VVIX',
                blurb: 'Volatility of the VIX — stress in the options market itself; the “fear of fear.”',
                widget: tvChart('CBOE:VVIX'),
            },
            {
                num: 23,
                name: 'ATR',
                blurb: 'Average True Range — typical daily move; sizing and stop-distance gauge.',
                widget: chart(SPY, ['ATR@tv-basicstudies']),
            },
            {
                num: 24,
                name: 'Bollinger Band Width',
                blurb: 'Band width = volatility regime; squeezes (narrow) often precede big moves.',
                widget: chart(SPY, ['BollingerBandsWidth@tv-basicstudies']),
            },
            {
                num: 25,
                name: 'Historical Volatility',
                blurb: 'Realized (backward-looking) volatility — compare with VIX to see if fear is rich or cheap.',
                widget: chart(SPY, ['HistoricalVolatility@tv-basicstudies']),
            },
        ],
    },
    {
        id: 'breadth',
        label: 'Market Breadth',
        blurb: 'How many stocks participate — narrow leadership warns of fragile rallies. (These market-internal feeds open on TradingView.)',
        indicators: [
            {
                num: 26,
                name: 'Advance / Decline Line',
                blurb: 'Net advancing vs declining issues — confirms (or diverges from) the index trend.',
                widget: tvChart('USI:ADD'),
            },
            {
                num: 27,
                name: 'McClellan Oscillator',
                blurb: 'Breadth momentum from NYSE advances/declines; zero-line crosses flag breadth shifts.',
                widget: tvChart('USI:NYMO'),
            },
            {
                num: 28,
                name: '% Stocks Above 50DMA',
                blurb: 'Share of S&P 500 names above their 50-day average — short-term participation.',
                widget: tvChart('USI:S5FI'),
            },
            {
                num: 29,
                name: '% Stocks Above 200DMA',
                blurb: 'Share of S&P 500 names above their 200-day average — long-term participation/health.',
                widget: tvChart('USI:S5TH'),
            },
            {
                num: 30,
                name: 'New Highs / New Lows',
                blurb: 'NYSE net new 52-week highs — expansion = healthy trend, contraction = deterioration.',
                widget: tvChart('USI:MAHN'),
            },
            {
                num: 31,
                name: 'Equal Weight vs Cap Weight S&P',
                blurb: 'Equal-weight (RSP) overlaid on cap-weight (SPY). RSP ahead = broad participation; behind = a few megacaps carrying the index.',
                widget: chart('AMEX:RSP', [], 'D', [{ symbol: SPY, position: 'SameScale' }]),
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
                widget: tvChart('USI:PCC'),
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
                widget: tvChart('TVC:US02Y'),
            },
            {
                num: 37,
                name: 'US 10-Year Treasury Yield',
                blurb: 'The global benchmark rate — discounts growth, inflation and risk premia.',
                widget: tvChart('TVC:US10Y'),
            },
            {
                num: 38,
                name: '10Y – 2Y Yield Curve',
                blurb: 'Curve spread; sustained inversion (below zero) has preceded most recessions.',
                widget: tvChart('FRED:T10Y2Y'),
            },
            {
                num: 39,
                name: 'High Yield Credit Spread',
                blurb: 'Junk-bond spread over Treasuries — widening = rising default fear / risk-off.',
                widget: tvChart('FRED:BAMLH0A0HYM2'),
            },
            {
                num: 40,
                name: 'Investment Grade Credit Spread',
                blurb: 'IG corporate spread — a calmer credit-stress gauge; widening flags caution.',
                widget: tvChart('FRED:BAMLC0A0CM'),
            },
        ],
    },
    {
        id: 'macro',
        label: 'Macro & Cross-Asset',
        blurb: 'The broader backdrop — currencies, commodities, bonds and risk leadership. (Live ETF proxies.)',
        indicators: [
            {
                num: 41,
                name: 'US Dollar Index',
                blurb: 'Dollar strength (via UUP). A rising USD tightens global liquidity and often pressures risk assets.',
                widget: chart('AMEX:UUP'),
            },
            {
                num: 42,
                name: 'Gold',
                blurb: 'Gold (via GLD) — a haven and real-rates/inflation gauge; strength often signals caution or debasement fears.',
                widget: chart('AMEX:GLD'),
            },
            {
                num: 43,
                name: 'Crude Oil (WTI)',
                blurb: 'Oil (via USO) — growth and inflation pulse; sharp moves feed through to CPI and risk sentiment.',
                widget: chart('AMEX:USO'),
            },
            {
                num: 44,
                name: 'Copper',
                blurb: 'Copper (via CPER) — “Dr. Copper,” a real-economy demand barometer; strength = global growth.',
                widget: chart('AMEX:CPER'),
            },
            {
                num: 45,
                name: 'Bitcoin',
                blurb: 'Bitcoin (via the IBIT spot ETF) — a high-beta risk-appetite and liquidity proxy.',
                widget: chart('NASDAQ:IBIT'),
            },
            {
                num: 46,
                name: '20Y+ Treasuries',
                blurb: 'Long bonds (via TLT) — price moves inverse to long yields; rising TLT = falling rates / risk-off bid.',
                widget: chart('NASDAQ:TLT'),
            },
            {
                num: 47,
                name: 'Small Caps (Russell 2000)',
                blurb: 'Small caps (via IWM) — leadership vs large caps signals risk appetite and breadth of the cycle.',
                widget: chart('AMEX:IWM'),
            },
            {
                num: 48,
                name: 'Semiconductors',
                blurb: 'Chips (via SMH) — the cyclical heart of tech; often leads the broad market up and down.',
                widget: chart('NASDAQ:SMH'),
            },
        ],
    },
    {
        id: 'valuation',
        label: 'Valuation',
        blurb: 'How expensive the market is — context for long-run return expectations. (Open at source.)',
        indicators: [
            {
                num: 49,
                name: 'Buffett Indicator',
                blurb: 'Total US market cap ÷ GDP — Buffett’s “best single measure” of overall valuation; high = stretched.',
                widget: external(
                    'Current Market Valuation',
                    'https://www.currentmarketvaluation.com/models/buffett-indicator.php'
                ),
            },
            {
                num: 50,
                name: 'Shiller CAPE (PE10)',
                blurb: 'Cyclically-adjusted P/E (10-yr real earnings) — smooths the cycle; elevated CAPE = lower expected returns.',
                widget: external('multpl.com', 'https://www.multpl.com/shiller-pe'),
            },
            {
                num: 51,
                name: 'S&P 500 P/E (TTM)',
                blurb: 'Trailing price-to-earnings for the S&P 500 — the headline valuation multiple vs its history.',
                widget: external('multpl.com', 'https://www.multpl.com/s-p-500-pe-ratio'),
            },
        ],
    },
    {
        id: 'money',
        label: 'Money & Liquidity',
        blurb: 'Liquidity and leverage behind the market — fuel for (or drag on) risk assets.',
        indicators: [
            {
                num: 52,
                name: 'M2 Money Supply',
                blurb: 'Broad money in the economy — expanding M2 adds liquidity that tends to lift asset prices; contraction tightens.',
                widget: tvChart('FRED:M2SL'),
            },
            {
                num: 53,
                name: 'Margin Debt',
                blurb: 'Borrowing against portfolios (FINRA) — rising leverage fuels rallies but amplifies drawdowns.',
                widget: external(
                    'FINRA',
                    'https://www.finra.org/investors/learn-to-invest/advanced-investing/margin-statistics'
                ),
            },
            {
                num: 54,
                name: 'Copper / Gold Ratio',
                blurb: 'Copper vs gold — a growth-vs-fear gauge that tends to track bond yields and the economic cycle.',
                widget: tvChart('AMEX:CPER/AMEX:GLD'),
            },
        ],
    },
];

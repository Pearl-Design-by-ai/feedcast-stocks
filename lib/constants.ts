export const NAV_ITEMS = [
    { href: '/', label: 'Dashboard' },
    { href: '/search', label: 'Search' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/alerts', label: 'Alerts' },
    { href: '/bubble-detector', label: 'Bubble Detector' },
    { href: '/learn', label: 'Learn' },
];

// Market-analysis pages, grouped under a single "Markets" dropdown in the nav.
export const MARKETS_NAV = {
    label: 'Markets',
    items: [
        { href: '/ask', label: 'Ask the Markets' },
        { href: '/market-regime', label: 'Market Regime' },
        { href: '/market-indicators', label: 'Indicators' },
        { href: '/sectors', label: 'Sectors' },
        { href: '/world-indices', label: 'World Indices' },
        { href: '/currency', label: 'Currency' },
        { href: '/commodities', label: 'Commodities' },
        { href: '/fixed-income', label: 'Fixed Income' },
        { href: '/crypto', label: 'Crypto' },
        { href: '/economic-calendar', label: 'Economic Calendar' },
        { href: '/calendar', label: 'Earnings & IPO' },
        { href: '/screener', label: 'Screener' },
        { href: '/compare', label: 'Compare' },
    ],
};

// TradingView Charts
export const HEATMAP_WIDGET_CONFIG = {
    dataSource: 'SPX500',
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    grouping: 'sector',
    isTransparent: true,
    locale: 'en',
    symbolUrl: '',
    colorTheme: 'dark',
    exchanges: [],
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '600',
};

export const TOP_STORIES_WIDGET_CONFIG = {
    displayMode: 'regular',
    feedMode: 'market',
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    market: 'stock',
    width: '100%',
    height: '600',
};

export const MARKET_DATA_WIDGET_CONFIG = {
    title: 'Stocks',
    width: '100%',
    height: 600,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: [
        {
            name: 'Financial',
            symbols: [
                { name: 'NYSE:JPM', displayName: 'JPMorgan Chase' },
                { name: 'NYSE:WFC', displayName: 'Wells Fargo Co New' },
                { name: 'NYSE:BAC', displayName: 'Bank Amer Corp' },
                { name: 'NYSE:HSBC', displayName: 'Hsbc Hldgs Plc' },
                { name: 'NYSE:C', displayName: 'Citigroup Inc' },
                { name: 'NYSE:MA', displayName: 'Mastercard Incorporated' },
            ],
        },
        {
            name: 'Technology',
            symbols: [
                { name: 'NASDAQ:AAPL', displayName: 'Apple' },
                { name: 'NASDAQ:GOOGL', displayName: 'Alphabet' },
                { name: 'NASDAQ:MSFT', displayName: 'Microsoft' },
                { name: 'NASDAQ:META', displayName: 'Meta Platforms' },
                { name: 'NYSE:ORCL', displayName: 'Oracle Corp' },
                { name: 'NASDAQ:INTC', displayName: 'Intel Corp' },
            ],
        },
        {
            name: 'Services',
            symbols: [
                { name: 'NASDAQ:AMZN', displayName: 'Amazon' },
                { name: 'NYSE:BABA', displayName: 'Alibaba Group Hldg Ltd' },
                { name: 'NYSE:T', displayName: 'At&t Inc' },
                { name: 'NYSE:WMT', displayName: 'Walmart' },
                { name: 'NYSE:V', displayName: 'Visa' },
            ],
        },
    ],
};

export const SYMBOL_INFO_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    width: '100%',
    height: 170,
});

export const CANDLE_CHART_WIDGET_CONFIG = (symbol: string) => ({
    allow_symbol_change: false,
    calendar: false,
    details: true,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 1,
    symbol: symbol.toUpperCase(),
    theme: 'dark',
    timezone: 'exchange',
    backgroundColor: '#141414',
    gridColor: '#141414',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

export const BASELINE_WIDGET_CONFIG = (symbol: string) => ({
    allow_symbol_change: false,
    calendar: false,
    details: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 10,
    symbol: symbol.toUpperCase(),
    theme: 'dark',
    timezone: 'exchange',
    backgroundColor: '#141414',
    gridColor: '#141414',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

// Advanced Real-Time Chart — used by the Market Indicators section. Accepts an
// arbitrary symbol (index, ratio, FRED/USI breadth series, etc.) plus a list of
// built-in studies (RSI, MACD, Ichimoku, …). Studies may be plain ids or
// { id, inputs } objects to override defaults (e.g. SMA length 200, RSI length 2).
export const ADVANCED_CHART_WIDGET_CONFIG = (
    symbol: string,
    studies: Array<string | { id: string; inputs?: Record<string, unknown> }> = [],
    interval: string = 'D',
    compareSymbols: Array<{ symbol: string; position: string }> = []
) => ({
    allow_symbol_change: false,
    calendar: false,
    details: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval,
    locale: 'en',
    save_image: false,
    style: '2',
    symbol,
    theme: 'dark',
    timezone: 'exchange',
    backgroundColor: '#141414',
    gridColor: '#141414',
    withdateranges: false,
    studies,
    compareSymbols,
    support_host: 'https://www.tradingview.com',
    width: '100%',
    height: 460,
});

export const TECHNICAL_ANALYSIS_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'dark',
    isTransparent: 'true',
    locale: 'en',
    width: '100%',
    height: 400,
    interval: '1h',
    largeChartUrl: '',
});

export const COMPANY_PROFILE_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'dark',
    isTransparent: 'true',
    locale: 'en',
    width: '100%',
    height: 440,
});

export const COMPANY_FINANCIALS_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'dark',
    isTransparent: 'true',
    locale: 'en',
    width: '100%',
    height: 464,
    displayMode: 'regular',
    largeChartUrl: '',
});

// --- Currency / Forex page widgets ---------------------------------------

const FOREX_CURRENCIES = ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'];

export const FOREX_HEATMAP_WIDGET_CONFIG = {
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    currencies: FOREX_CURRENCIES,
    backgroundColor: '#141414',
    width: '100%',
    height: 400,
};

export const FOREX_CROSS_RATES_WIDGET_CONFIG = {
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    currencies: FOREX_CURRENCIES,
    backgroundColor: '#141414',
    width: '100%',
    height: 400,
};

// Compact price line for a single FX pair.
export const MINI_SYMBOL_WIDGET_CONFIG = (symbol: string) => ({
    symbol,
    width: '100%',
    height: 180,
    locale: 'en',
    dateRange: '12M',
    colorTheme: 'dark',
    isTransparent: true,
    autosize: false,
    largeChartUrl: '',
    chartOnly: false,
});

// Economic calendar (TradingView events widget).
export const ECONOMIC_CALENDAR_WIDGET_CONFIG = {
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    countryFilter: 'us,eu,jp,gb,cn,de,fr,ca,au,ch,it,es,in,br,tr',
    importanceFilter: '0,1',
    backgroundColor: '#141414',
    width: '100%',
    height: 650,
};

// Stock screener (TradingView screener widget).
export const SCREENER_WIDGET_CONFIG = {
    defaultColumn: 'overview',
    defaultScreen: 'most_capitalized',
    market: 'america',
    showToolbar: true,
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    width: '100%',
    height: 650,
};

// Crypto market-cap heatmap.
export const CRYPTO_HEATMAP_WIDGET_CONFIG = {
    dataSource: 'Crypto',
    blockSize: 'market_cap_calc',
    blockColor: 'change',
    locale: 'en',
    symbolUrl: '',
    colorTheme: 'dark',
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: 500,
};

export const POPULAR_STOCK_SYMBOLS = [
    // Tech Giants (the big technology companies)
    'AAPL',
    'MSFT',
    'GOOGL',
    'AMZN',
    'TSLA',
    'META',
    'NVDA',
    'NFLX',
    'ORCL',
    'CRM',

    // Growing Tech Companies
    'ADBE',
    'INTC',
    'AMD',
    'PYPL',
    'UBER',
    'ZOOM',
    'SPOT',
    'SQ',
    'SHOP',
    'ROKU',

    // Newer Tech Companies
    'SNOW',
    'PLTR',
    'COIN',
    'RBLX',
    'DDOG',
    'CRWD',
    'NET',
    'OKTA',
    'TWLO',
    'ZM',

    // Consumer & Delivery Apps
    'DOCU',
    'PTON',
    'PINS',
    'SNAP',
    'LYFT',
    'DASH',
    'ABNB',
    'RIVN',
    'LCID',
    'NIO',

    // International Companies
    'XPEV',
    'LI',
    'BABA',
    'JD',
    'PDD',
    'TME',
    'BILI',
    'DIDI',
    'GRAB',
    'SE',
];

export const NO_MARKET_NEWS =
    '<p class="mobile-text" style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#4b5563;">No market news available today. Please check back tomorrow.</p>';

export const WATCHLIST_TABLE_HEADER = [
    'Company',
    'Symbol',
    'Price',
    'Change',
    'Market Cap',
    'P/E Ratio',
    'Alert',
    'Action',
];

// Country / region equity markets, accessed through their USD-denominated,
// US-listed ETFs (mostly iShares MSCI single-country funds). These are liquid
// and render in TradingView's free embeds with delayed data.

export interface CountryEtf {
    code: string; // ETF ticker, e.g. "EWJ"
    name: string; // country / region
    symbol: string; // TradingView symbol
}

export interface WorldGroup {
    id: string;
    label: string;
    blurb: string;
    etfs: CountryEtf[];
}

export const WORLD_GROUPS: WorldGroup[] = [
    {
        id: 'global',
        label: 'US & Global',
        blurb: 'The US market and broad world / developed / emerging baskets — your benchmarks.',
        etfs: [
            { code: 'SPY', name: 'United States (S&P 500)', symbol: 'AMEX:SPY' },
            { code: 'ACWI', name: 'All-World', symbol: 'NASDAQ:ACWI' },
            { code: 'EFA', name: 'Developed ex-US', symbol: 'AMEX:EFA' },
            { code: 'EEM', name: 'Emerging Markets', symbol: 'AMEX:EEM' },
        ],
    },
    {
        id: 'americas',
        label: 'Americas',
        blurb: 'North and Latin American markets in USD terms.',
        etfs: [
            { code: 'EWC', name: 'Canada', symbol: 'AMEX:EWC' },
            { code: 'EWW', name: 'Mexico', symbol: 'AMEX:EWW' },
            { code: 'EWZ', name: 'Brazil', symbol: 'AMEX:EWZ' },
        ],
    },
    {
        id: 'europe',
        label: 'Europe',
        blurb: 'Major European equity markets, USD-denominated.',
        etfs: [
            { code: 'EZU', name: 'Eurozone', symbol: 'AMEX:EZU' },
            { code: 'EWG', name: 'Germany', symbol: 'AMEX:EWG' },
            { code: 'EWU', name: 'United Kingdom', symbol: 'AMEX:EWU' },
            { code: 'EWQ', name: 'France', symbol: 'AMEX:EWQ' },
            { code: 'EWL', name: 'Switzerland', symbol: 'AMEX:EWL' },
            { code: 'EWI', name: 'Italy', symbol: 'AMEX:EWI' },
            { code: 'EWP', name: 'Spain', symbol: 'AMEX:EWP' },
            { code: 'EWN', name: 'Netherlands', symbol: 'AMEX:EWN' },
            { code: 'EWD', name: 'Sweden', symbol: 'AMEX:EWD' },
        ],
    },
    {
        id: 'asia-pacific',
        label: 'Asia-Pacific',
        blurb: 'Developed Asia-Pacific markets.',
        etfs: [
            { code: 'EWJ', name: 'Japan', symbol: 'AMEX:EWJ' },
            { code: 'EWA', name: 'Australia', symbol: 'AMEX:EWA' },
            { code: 'EWH', name: 'Hong Kong', symbol: 'AMEX:EWH' },
            { code: 'EWS', name: 'Singapore', symbol: 'AMEX:EWS' },
            { code: 'EWY', name: 'South Korea', symbol: 'AMEX:EWY' },
            { code: 'EWT', name: 'Taiwan', symbol: 'AMEX:EWT' },
        ],
    },
    {
        id: 'emerging',
        label: 'Emerging Markets',
        blurb: 'High-growth, higher-volatility emerging markets.',
        etfs: [
            { code: 'MCHI', name: 'China', symbol: 'NASDAQ:MCHI' },
            { code: 'INDA', name: 'India', symbol: 'BATS:INDA' },
            { code: 'EZA', name: 'South Africa', symbol: 'AMEX:EZA' },
            { code: 'EIDO', name: 'Indonesia', symbol: 'AMEX:EIDO' },
            { code: 'TUR', name: 'Turkey', symbol: 'AMEX:TUR' },
            { code: 'KSA', name: 'Saudi Arabia', symbol: 'AMEX:KSA' },
        ],
    },
];

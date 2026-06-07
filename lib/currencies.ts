// Major USD currency pairs for the Currency (Forex) page, grouped by region.
// Every pair is quoted against the US dollar. TradingView's forex feeds (FX /
// FX_IDC) are free and render in the embedded widgets without the gating that
// affects index/macro symbols.

export interface CurrencyPair {
    code: string; // e.g. "EUR/USD"
    name: string; // the non-USD currency's name
    symbol: string; // TradingView symbol
}

export interface CurrencyGroup {
    id: string;
    label: string;
    blurb: string;
    pairs: CurrencyPair[];
}

export const CURRENCY_GROUPS: CurrencyGroup[] = [
    {
        id: 'majors',
        label: 'Major Pairs',
        blurb: 'The most-traded USD pairs — deepest liquidity and tightest spreads.',
        pairs: [
            { code: 'EUR/USD', name: 'Euro', symbol: 'FX:EURUSD' },
            { code: 'GBP/USD', name: 'British Pound', symbol: 'FX:GBPUSD' },
            { code: 'USD/JPY', name: 'Japanese Yen', symbol: 'FX:USDJPY' },
            { code: 'USD/CHF', name: 'Swiss Franc', symbol: 'FX:USDCHF' },
            { code: 'AUD/USD', name: 'Australian Dollar', symbol: 'FX:AUDUSD' },
            { code: 'USD/CAD', name: 'Canadian Dollar', symbol: 'FX:USDCAD' },
            { code: 'NZD/USD', name: 'New Zealand Dollar', symbol: 'FX:NZDUSD' },
        ],
    },
    {
        id: 'europe',
        label: 'European',
        blurb: 'Scandinavian and Central-European currencies versus the dollar.',
        pairs: [
            { code: 'USD/SEK', name: 'Swedish Krona', symbol: 'FX:USDSEK' },
            { code: 'USD/NOK', name: 'Norwegian Krone', symbol: 'FX:USDNOK' },
            { code: 'USD/PLN', name: 'Polish Zloty', symbol: 'FX_IDC:USDPLN' },
            { code: 'USD/DKK', name: 'Danish Krone', symbol: 'FX_IDC:USDDKK' },
            { code: 'USD/HUF', name: 'Hungarian Forint', symbol: 'FX_IDC:USDHUF' },
        ],
    },
    {
        id: 'asia-pacific',
        label: 'Asia-Pacific',
        blurb: 'Asian and Pacific currencies — key to global trade and risk sentiment.',
        pairs: [
            { code: 'USD/CNH', name: 'Chinese Yuan (offshore)', symbol: 'FX:USDCNH' },
            { code: 'USD/HKD', name: 'Hong Kong Dollar', symbol: 'FX_IDC:USDHKD' },
            { code: 'USD/SGD', name: 'Singapore Dollar', symbol: 'FX:USDSGD' },
            { code: 'USD/KRW', name: 'South Korean Won', symbol: 'FX_IDC:USDKRW' },
            { code: 'USD/INR', name: 'Indian Rupee', symbol: 'FX_IDC:USDINR' },
        ],
    },
    {
        id: 'americas-emea',
        label: 'Americas & EMEA',
        blurb: 'High-beta emerging-market currencies — sensitive to risk appetite and rates.',
        pairs: [
            { code: 'USD/MXN', name: 'Mexican Peso', symbol: 'FX:USDMXN' },
            { code: 'USD/BRL', name: 'Brazilian Real', symbol: 'FX_IDC:USDBRL' },
            { code: 'USD/ZAR', name: 'South African Rand', symbol: 'FX:USDZAR' },
            { code: 'USD/TRY', name: 'Turkish Lira', symbol: 'FX_IDC:USDTRY' },
            { code: 'USD/RUB', name: 'Russian Ruble', symbol: 'FX_IDC:USDRUB' },
        ],
    },
];

// Fixed-income universe for the Bonds page: USD-listed bond ETFs grouped by
// sector, plus Treasury-yield links and a short "Fixed Income 101" explainer.
// The ETFs are liquid US funds that render in TradingView's free embeds; the
// raw Treasury yields (TVC/FRED) are gated, so those are link-outs.

export interface BondEtf {
    code: string; // ticker
    name: string; // what it holds
    symbol: string; // TradingView symbol
}

export interface BondGroup {
    id: string;
    label: string;
    blurb: string;
    etfs: BondEtf[];
}

export const BOND_GROUPS: BondGroup[] = [
    {
        id: 'treasuries',
        label: 'US Treasuries',
        blurb: 'Government bonds by maturity — the risk-free curve, from T-bills to the long bond.',
        etfs: [
            { code: 'BIL', name: '1-3 Month T-Bills', symbol: 'AMEX:BIL' },
            { code: 'SHY', name: '1-3 Year Treasury', symbol: 'NASDAQ:SHY' },
            { code: 'IEI', name: '3-7 Year Treasury', symbol: 'NASDAQ:IEI' },
            { code: 'IEF', name: '7-10 Year Treasury', symbol: 'NASDAQ:IEF' },
            { code: 'TLH', name: '10-20 Year Treasury', symbol: 'AMEX:TLH' },
            { code: 'TLT', name: '20+ Year Treasury', symbol: 'NASDAQ:TLT' },
            { code: 'GOVT', name: 'Broad US Treasury', symbol: 'AMEX:GOVT' },
        ],
    },
    {
        id: 'core',
        label: 'Core / Aggregate',
        blurb: 'Diversified, all-in-one bond exposure — the “total bond market” one-fund options.',
        etfs: [
            { code: 'AGG', name: 'US Aggregate Bond', symbol: 'AMEX:AGG' },
            { code: 'BND', name: 'Total Bond Market', symbol: 'NASDAQ:BND' },
            { code: 'BNDX', name: 'Intl Bond (USD-hedged)', symbol: 'NASDAQ:BNDX' },
            { code: 'MBB', name: 'Mortgage-Backed (MBS)', symbol: 'NASDAQ:MBB' },
        ],
    },
    {
        id: 'ig-corp',
        label: 'Investment-Grade Corporate',
        blurb: 'Bonds of financially strong companies — extra yield over Treasuries at modest credit risk.',
        etfs: [
            { code: 'LQD', name: 'IG Corporate', symbol: 'AMEX:LQD' },
            { code: 'VCIT', name: 'Intermediate IG Corp', symbol: 'NASDAQ:VCIT' },
            { code: 'VCSH', name: 'Short-Term IG Corp', symbol: 'NASDAQ:VCSH' },
            { code: 'IGSB', name: 'Short-Term IG Corp', symbol: 'NASDAQ:IGSB' },
        ],
    },
    {
        id: 'high-yield',
        label: 'High Yield',
        blurb: '“Junk” bonds — higher income to compensate for higher default risk; spreads widen in stress.',
        etfs: [
            { code: 'HYG', name: 'High Yield Corporate', symbol: 'AMEX:HYG' },
            { code: 'JNK', name: 'High Yield Bond', symbol: 'AMEX:JNK' },
            { code: 'SHYG', name: 'Short-Term High Yield', symbol: 'AMEX:SHYG' },
        ],
    },
    {
        id: 'tips',
        label: 'Inflation-Protected (TIPS)',
        blurb: 'Principal adjusts with inflation — protects real purchasing power.',
        etfs: [
            { code: 'TIP', name: 'TIPS', symbol: 'AMEX:TIP' },
            { code: 'VTIP', name: 'Short-Term TIPS', symbol: 'NASDAQ:VTIP' },
            { code: 'SCHP', name: 'TIPS', symbol: 'AMEX:SCHP' },
        ],
    },
    {
        id: 'muni',
        label: 'Municipal',
        blurb: 'US state/local government bonds — interest is typically federal-tax-exempt.',
        etfs: [
            { code: 'MUB', name: 'National Muni Bond', symbol: 'AMEX:MUB' },
            { code: 'VTEB', name: 'Tax-Exempt Muni', symbol: 'AMEX:VTEB' },
        ],
    },
    {
        id: 'em-bonds',
        label: 'Emerging-Market Bonds',
        blurb: 'Developing-country debt — higher yields with currency and political risk.',
        etfs: [
            { code: 'EMB', name: 'USD EM Sovereign', symbol: 'NASDAQ:EMB' },
            { code: 'EMLC', name: 'Local-Currency EM', symbol: 'AMEX:EMLC' },
            { code: 'PCY', name: 'EM Sovereign Debt', symbol: 'AMEX:PCY' },
            { code: 'VWOB', name: 'EM Government Bond', symbol: 'NASDAQ:VWOB' },
        ],
    },
];

// Raw Treasury yields are gated in the embed → link to the TradingView chart.
export interface YieldLink {
    label: string;
    symbol: string;
    blurb: string;
}

export const TREASURY_YIELDS: YieldLink[] = [
    { label: 'US 2-Year', symbol: 'TVC:US02Y', blurb: 'Short end — tracks Fed-policy expectations.' },
    { label: 'US 5-Year', symbol: 'TVC:US05Y', blurb: 'Belly of the curve.' },
    { label: 'US 10-Year', symbol: 'TVC:US10Y', blurb: 'The global benchmark rate.' },
    { label: 'US 30-Year', symbol: 'TVC:US30Y', blurb: 'Long bond — growth & inflation premia.' },
    { label: '10Y – 2Y Curve', symbol: 'FRED:T10Y2Y', blurb: 'Inversion has preceded recessions.' },
    { label: 'High Yield Spread', symbol: 'FRED:BAMLH0A0HYM2', blurb: 'Junk spread — credit-stress gauge.' },
];

export interface EduItem {
    title: string;
    body: string;
}

export const FIXED_INCOME_EDU: EduItem[] = [
    {
        title: 'What is fixed income?',
        body: 'Bonds are loans to governments or companies that pay regular interest (coupons) and return your principal at maturity. They provide income and tend to be steadier than stocks.',
    },
    {
        title: 'Prices move opposite to yields',
        body: 'When interest rates rise, the price of existing bonds falls (their fixed coupon is now less attractive) — and vice versa. Yield up, price down.',
    },
    {
        title: 'Duration = rate risk',
        body: 'Duration measures sensitivity to rates. A duration of 7 means roughly a 7% price drop if rates rise 1%. Long bonds (TLT) swing a lot; T-bills (BIL) barely move.',
    },
    {
        title: 'Credit quality',
        body: 'Investment-grade issuers (AGG, LQD) are financially strong. High-yield “junk” bonds (HYG, JNK) pay more to offset higher default risk; their spreads widen in stress.',
    },
    {
        title: 'The yield curve',
        body: 'Yields plotted across maturities. Normally upward-sloping; an inverted curve (short yields above long) has historically preceded recessions.',
    },
    {
        title: 'Inflation & TIPS',
        body: 'TIPS (TIP) adjust their principal with inflation, protecting real purchasing power. Plain Treasuries don’t — high inflation erodes their fixed payments.',
    },
    {
        title: 'Emerging-market bonds',
        body: 'EM debt (EMB, EMLC) offers higher yields but adds currency and political risk. USD-denominated (EMB) avoids local-FX risk; local-currency (EMLC) does not.',
    },
    {
        title: 'Key risks to watch',
        body: 'Interest-rate risk (duration), credit risk (default), inflation risk, liquidity risk and reinvestment risk. Each ETF below shows a technical Buy/Sell rating as a quick market view — not personalized advice.',
    },
];

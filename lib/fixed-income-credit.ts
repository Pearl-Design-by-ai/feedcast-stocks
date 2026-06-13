// Corporate & global credit catalog for the Fixed Income → "Corporate & Global
// Credit" sub-page: investment-grade and high-yield selections in USD and EUR,
// plus an emerging-market sovereign map organized by country.
//
// Tradeable vehicles are ETFs (individual eurobonds/CUSIPs aren't available on
// the free data feeds and aren't personalized advice). USD funds are US-listed;
// EUR funds are UCITS listed in Amsterdam (.AS) / London (.L) and priced in
// euros — their returns still render from Yahoo EOD. The EM-by-country table is
// curated reference, grounded in mid-2026 research and clearly not advice.

export interface CreditEtf {
    code: string;
    name: string;
    symbol: string; // TradingView symbol (charts/links)
    ccy: 'USD' | 'EUR';
}

export interface CreditGroup {
    id: string;
    label: string;
    blurb: string;
    etfs: CreditEtf[];
}

// --- Investment grade ---
export const IG_USD: CreditEtf[] = [
    { code: 'LQD', name: 'iShares IG Corporate', symbol: 'AMEX:LQD', ccy: 'USD' },
    { code: 'VCIT', name: 'Vanguard Interm. IG Corp', symbol: 'NASDAQ:VCIT', ccy: 'USD' },
    { code: 'IGIB', name: 'iShares 5-10yr IG Corp', symbol: 'NASDAQ:IGIB', ccy: 'USD' },
    { code: 'USIG', name: 'iShares Broad USD IG Corp', symbol: 'NASDAQ:USIG', ccy: 'USD' },
    { code: 'VCSH', name: 'Vanguard Short-Term IG', symbol: 'NASDAQ:VCSH', ccy: 'USD' },
];

export const IG_EUR: CreditEtf[] = [
    { code: 'IEAC', name: 'iShares € Corp Bond UCITS', symbol: 'EURONEXT:IEAC', ccy: 'EUR' },
    { code: 'IEBC', name: 'iShares € Corp ex-Fin', symbol: 'EURONEXT:IEBC', ccy: 'EUR' },
    { code: 'SUOE', name: 'iShares € Corp ESG', symbol: 'EURONEXT:SUOE', ccy: 'EUR' },
];

// --- High yield ---
export const HY_USD: CreditEtf[] = [
    { code: 'HYG', name: 'iShares HY Corporate', symbol: 'AMEX:HYG', ccy: 'USD' },
    { code: 'JNK', name: 'SPDR HY Bond', symbol: 'AMEX:JNK', ccy: 'USD' },
    { code: 'USHY', name: 'iShares Broad USD HY', symbol: 'AMEX:USHY', ccy: 'USD' },
    { code: 'SHYG', name: 'iShares 0-5yr HY Corp', symbol: 'AMEX:SHYG', ccy: 'USD' },
];

export const HY_EUR: CreditEtf[] = [
    { code: 'IHYG', name: 'iShares € High Yield UCITS', symbol: 'LSE:IHYG', ccy: 'EUR' },
    { code: 'EUNW', name: 'iShares € HY Corp (Xetra)', symbol: 'XETR:EUNW', ccy: 'EUR' },
];

// --- Emerging-market sovereign / corporate aggregates ---
export const EM_AGGREGATE: CreditEtf[] = [
    { code: 'EMB', name: 'iShares USD EM Sovereign', symbol: 'NASDAQ:EMB', ccy: 'USD' },
    { code: 'PCY', name: 'Invesco EM Sovereign Debt', symbol: 'AMEX:PCY', ccy: 'USD' },
    { code: 'VWOB', name: 'Vanguard EM Government', symbol: 'NASDAQ:VWOB', ccy: 'USD' },
    { code: 'EMHY', name: 'iShares EM High Yield', symbol: 'AMEX:EMHY', ccy: 'USD' },
    { code: 'CEMB', name: 'iShares EM Corporate', symbol: 'NASDAQ:CEMB', ccy: 'USD' },
    { code: 'EMLC', name: 'VanEck Local-Currency EM', symbol: 'AMEX:EMLC', ccy: 'USD' },
];

export type RatingBucket = 'Investment grade' | 'Crossover (BB)' | 'High yield';

export interface EmCountry {
    country: string;
    flag: string;
    region: string;
    /** Hard-currency sovereign rating bucket (approx., mid-2026). */
    bucket: RatingBucket;
    /** Curated 2026 note — reference, not advice. */
    note: string;
}

// Organized by country — the major USD-eurobond sovereign issuers, with a
// mid-2026 read from the research sources listed on the page.
export const EM_COUNTRIES: EmCountry[] = [
    { country: 'Mexico', flag: '🇲🇽', region: 'LatAm', bucket: 'Investment grade', note: 'Deep, liquid curve; nearshoring tailwind. A core IG anchor for USD EM portfolios.' },
    { country: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East', bucket: 'Investment grade', note: 'Heavy 2026 issuance funding Vision 2030; high-quality Gulf IG with oil sensitivity.' },
    { country: 'Indonesia', flag: '🇮🇩', region: 'SE Asia', bucket: 'Investment grade', note: 'Among the largest regional refinancers in 2026; solid IG with strong growth.' },
    { country: 'Chile', flag: '🇨🇱', region: 'Andean', bucket: 'Investment grade', note: 'Top-rated Andean credit; favored on strong fundamentals and copper exposure.' },
    { country: 'Peru', flag: '🇵🇪', region: 'Andean', bucket: 'Investment grade', note: 'Low debt, orthodox policy — a research favorite among Andean markets for 2026.' },
    { country: 'Brazil', flag: '🇧🇷', region: 'LatAm', bucket: 'Crossover (BB)', note: 'Attractive carry; story hinges on fiscal adjustment. High local + hard-ccy liquidity.' },
    { country: 'Colombia', flag: '🇨🇴', region: 'LatAm', bucket: 'Crossover (BB)', note: 'Wider spreads on fiscal concerns; carry play if consolidation delivers.' },
    { country: 'India', flag: '🇮🇳', region: 'South Asia', bucket: 'Crossover (BB)', note: 'Index inclusion flows support local debt; fast growth, mostly local-currency access.' },
    { country: 'South Africa', flag: '🇿🇦', region: 'Africa', bucket: 'High yield', note: 'High real yields; fiscal and power-grid risks keep it firmly in the HY bucket.' },
    { country: 'Türkiye', flag: '🇹🇷', region: 'EMEA', bucket: 'High yield', note: 'Largest 2026 sovereign refinancing need; re-rating on orthodox policy, still HY.' },
    { country: 'Nigeria', flag: '🇳🇬', region: 'Africa', bucket: 'High yield', note: 'Single-B carry with reform optionality after FX liberalization; high volatility.' },
    { country: 'Egypt', flag: '🇪🇬', region: 'Africa', bucket: 'High yield', note: 'High-coupon single-B; Gulf and IMF support central to the refinancing path.' },
];

export const BUCKET_TONE: Record<RatingBucket, 'pos' | 'warn' | 'neg'> = {
    'Investment grade': 'pos',
    'Crossover (BB)': 'warn',
    'High yield': 'neg',
};

export interface CreditSource {
    label: string;
    url: string;
}

export const CREDIT_SOURCES: CreditSource[] = [
    { label: 'PineBridge — 2026 Emerging Market Debt Outlook', url: 'https://www.pinebridge.com/en/insights/2026-emerging-market-debt-outlook' },
    { label: 'CreditSights — Emerging Markets 2026 Outlook', url: 'https://know.creditsights.com/insights/emerging-markets-2026-outlook/' },
    { label: 'VanEck — Why an EM Bonds Allocation in 2026', url: 'https://www.vaneck.com/us/en/blogs/emerging-markets-bonds/why-investors-should-consider-an-emerging-markets-bonds-allocation-in-2026/' },
    { label: 'Morningstar — Outlook for European Bonds in 2026', url: 'https://global.morningstar.com/en-eu/bonds/whats-outlook-european-bonds-2026' },
];

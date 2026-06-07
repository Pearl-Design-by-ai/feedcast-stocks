// The 11 US equity sectors via the SPDR Select Sector ETFs (USD, NYSE Arca).
// Used to read sector rotation — which parts of the market lead and lag.

export interface SectorEtf {
    code: string;
    name: string;
    symbol: string;
}

export const SECTOR_ETFS: SectorEtf[] = [
    { code: 'XLK', name: 'Technology', symbol: 'AMEX:XLK' },
    { code: 'XLC', name: 'Communication Services', symbol: 'AMEX:XLC' },
    { code: 'XLY', name: 'Consumer Discretionary', symbol: 'AMEX:XLY' },
    { code: 'XLP', name: 'Consumer Staples', symbol: 'AMEX:XLP' },
    { code: 'XLE', name: 'Energy', symbol: 'AMEX:XLE' },
    { code: 'XLF', name: 'Financials', symbol: 'AMEX:XLF' },
    { code: 'XLV', name: 'Health Care', symbol: 'AMEX:XLV' },
    { code: 'XLI', name: 'Industrials', symbol: 'AMEX:XLI' },
    { code: 'XLB', name: 'Materials', symbol: 'AMEX:XLB' },
    { code: 'XLRE', name: 'Real Estate', symbol: 'AMEX:XLRE' },
    { code: 'XLU', name: 'Utilities', symbol: 'AMEX:XLU' },
];

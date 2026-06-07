// Crypto coins via live exchange pairs (Binance, embed-safe), grouped, plus the
// TradingView-calculated market-cap measures (gated → link out).
import type { InstrumentGroup } from '@/components/markets/InstrumentAccordion';

export const CRYPTO_GROUPS: InstrumentGroup[] = [
    {
        id: 'majors',
        label: 'Majors',
        blurb: 'The largest, most liquid coins — the crypto bellwethers.',
        items: [
            { title: 'Bitcoin', subtitle: 'BTC', symbol: 'BINANCE:BTCUSDT' },
            { title: 'Ethereum', subtitle: 'ETH', symbol: 'BINANCE:ETHUSDT' },
            { title: 'BNB', subtitle: 'BNB', symbol: 'BINANCE:BNBUSDT' },
            { title: 'XRP', subtitle: 'XRP', symbol: 'BINANCE:XRPUSDT' },
            { title: 'Solana', subtitle: 'SOL', symbol: 'BINANCE:SOLUSDT' },
            { title: 'Cardano', subtitle: 'ADA', symbol: 'BINANCE:ADAUSDT' },
            { title: 'Dogecoin', subtitle: 'DOGE', symbol: 'BINANCE:DOGEUSDT' },
        ],
    },
    {
        id: 'layer1',
        label: 'Layer-1 / Smart Contract',
        blurb: 'Alternative base chains — alt risk appetite and rotation.',
        items: [
            { title: 'Avalanche', subtitle: 'AVAX', symbol: 'BINANCE:AVAXUSDT' },
            { title: 'Polkadot', subtitle: 'DOT', symbol: 'BINANCE:DOTUSDT' },
            { title: 'NEAR', subtitle: 'NEAR', symbol: 'BINANCE:NEARUSDT' },
            { title: 'Cosmos', subtitle: 'ATOM', symbol: 'BINANCE:ATOMUSDT' },
            { title: 'TRON', subtitle: 'TRX', symbol: 'BINANCE:TRXUSDT' },
            { title: 'Toncoin', subtitle: 'TON', symbol: 'BINANCE:TONUSDT' },
        ],
    },
    {
        id: 'defi',
        label: 'DeFi & Utility',
        blurb: 'Infrastructure, DeFi and high-beta utility tokens.',
        items: [
            { title: 'Chainlink', subtitle: 'LINK', symbol: 'BINANCE:LINKUSDT' },
            { title: 'Uniswap', subtitle: 'UNI', symbol: 'BINANCE:UNIUSDT' },
            { title: 'Aave', subtitle: 'AAVE', symbol: 'BINANCE:AAVEUSDT' },
            { title: 'Arbitrum', subtitle: 'ARB', symbol: 'BINANCE:ARBUSDT' },
            { title: 'Litecoin', subtitle: 'LTC', symbol: 'BINANCE:LTCUSDT' },
            { title: 'Bitcoin Cash', subtitle: 'BCH', symbol: 'BINANCE:BCHUSDT' },
        ],
    },
];

export interface CryptoMarketLink {
    label: string;
    symbol: string;
    blurb: string;
}

export const CRYPTO_MARKET_LINKS: CryptoMarketLink[] = [
    { label: 'BTC Dominance', symbol: 'CRYPTOCAP:BTC.D', blurb: 'Bitcoin’s share of total crypto cap — risk-on/off within crypto.' },
    { label: 'Total Market Cap', symbol: 'CRYPTOCAP:TOTAL', blurb: 'Aggregate value of all crypto — the asset class’s overall tide.' },
    { label: 'Total ex-BTC (TOTAL2)', symbol: 'CRYPTOCAP:TOTAL2', blurb: 'Altcoin market cap excluding bitcoin — alt-season gauge.' },
];

// Commodities via USD-listed ETFs (NYSE Arca), grouped by complex. Embed-safe.
import type { InstrumentGroup } from '@/components/markets/InstrumentAccordion';

export const COMMODITY_GROUPS: InstrumentGroup[] = [
    {
        id: 'energy',
        label: 'Energy',
        blurb: 'Oil, gas and fuels — growth and inflation pulse.',
        items: [
            { title: 'WTI Crude Oil', subtitle: 'USO', symbol: 'AMEX:USO' },
            { title: 'Brent Crude Oil', subtitle: 'BNO', symbol: 'AMEX:BNO' },
            { title: 'Natural Gas', subtitle: 'UNG', symbol: 'AMEX:UNG' },
            { title: 'Gasoline', subtitle: 'UGA', symbol: 'AMEX:UGA' },
        ],
    },
    {
        id: 'metals',
        label: 'Metals',
        blurb: 'Precious and industrial metals — havens and real-economy demand.',
        items: [
            { title: 'Gold', subtitle: 'GLD', symbol: 'AMEX:GLD' },
            { title: 'Silver', subtitle: 'SLV', symbol: 'AMEX:SLV' },
            { title: 'Copper', subtitle: 'CPER', symbol: 'AMEX:CPER' },
            { title: 'Platinum', subtitle: 'PPLT', symbol: 'AMEX:PPLT' },
            { title: 'Palladium', subtitle: 'PALL', symbol: 'AMEX:PALL' },
        ],
    },
    {
        id: 'agriculture',
        label: 'Agriculture',
        blurb: 'Softs and grains — food inflation and weather-driven moves.',
        items: [
            { title: 'Agriculture (broad)', subtitle: 'DBA', symbol: 'AMEX:DBA' },
            { title: 'Corn', subtitle: 'CORN', symbol: 'AMEX:CORN' },
            { title: 'Wheat', subtitle: 'WEAT', symbol: 'AMEX:WEAT' },
            { title: 'Soybeans', subtitle: 'SOYB', symbol: 'AMEX:SOYB' },
        ],
    },
    {
        id: 'broad',
        label: 'Broad Baskets',
        blurb: 'Diversified commodity indices — the asset class in one ticker.',
        items: [
            { title: 'Diversified Commodities', subtitle: 'DBC', symbol: 'AMEX:DBC' },
            { title: 'Commodity Index', subtitle: 'GSG', symbol: 'AMEX:GSG' },
        ],
    },
];

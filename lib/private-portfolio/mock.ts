/**
 * SYNTHETIC preview data for /my-portfolio — round numbers and "Example …"
 * instruments only. Nothing here reflects a real portfolio. Loaded solely by
 * the dev-only PRIVATE_PORTFOLIO_MOCK switch (see gate.ts / the page), never in
 * a production build. Exported as raw table rows so the preview also exercises
 * the defensive parser.
 */

import type { PortfolioDocumentRow } from './types';

const AS_OF = '2026-01-15T07:00:00Z';

const h = (o: Record<string, unknown>) => ({ ccy: 'USD', ...o });

const accounts = [
    {
        id: 'personal-a',
        name: 'Örnek Hesap A',
        custodian: 'UBS',
        totalUsd: 1_219_000,
        holdings: [
            h({ name: 'Example Treasury 4% 2028', isin: 'XX0000000001', nominal: 500_000, price: 99, valueUsd: 495_000, couponPct: 4, maturity: '2028-06-30', ytmPct: 4.3, durationYrs: 2.4, annualIncomeUsd: 20_000, group: 'Devlet tahvili', custodian: 'UBS' }),
            h({ name: 'Example Bond 5% 2030', isin: 'XX0000000002', nominal: 400_000, price: 101, valueUsd: 404_000, couponPct: 5, maturity: '2030-03-15', ytmPct: 4.7, durationYrs: 3.9, annualIncomeUsd: 20_000, group: 'Kurumsal tahvil', custodian: 'UBS' }),
            h({ name: 'Example Bond 6% 2032', isin: 'XX0000000003', ccy: 'EUR', nominal: 200_000, price: 100, valueLocal: 200_000, valueUsd: 220_000, couponPct: 6, maturity: '2032-09-01', ytmPct: 5.8, durationYrs: 5.1, annualIncomeUsd: 13_200, group: 'Kurumsal tahvil', custodian: 'UBS' }),
            h({ name: 'Nakit USD', valueUsd: 100_000, group: 'Nakit', custodian: 'UBS' }),
        ],
    },
    {
        id: 'personal-b',
        name: 'Örnek Hesap B',
        custodian: 'IBKR',
        totalUsd: 850_000,
        holdings: [
            h({ name: 'Example Equity Index ETF', ticker: 'EXEQ', units: 1_000, price: 500, valueUsd: 500_000, annualIncomeUsd: 6_000, group: 'Hisse ETF', custodian: 'IBKR' }),
            h({ name: 'Example Short-Term Bond ETF', ticker: 'EXST', units: 3_000, price: 100, valueUsd: 300_000, ytmPct: 4.5, durationYrs: 1.8, annualIncomeUsd: 13_500, group: 'Tahvil ETF', custodian: 'IBKR' }),
            h({ name: 'Nakit USD', valueUsd: 50_000, group: 'Nakit', custodian: 'IBKR' }),
        ],
    },
    {
        id: 'company-c',
        name: 'Örnek Şirket Hesabı',
        custodian: 'Example Bank',
        totalUsd: 450_000,
        holdings: [
            h({ name: 'Example Money Market Fund', valueUsd: 250_000, ytmPct: 4.5, annualIncomeUsd: 11_250, group: 'Nakit', custodian: 'Example Bank', role: 'likidite' }),
            h({ name: 'Example Bond 4.5% 2029', isin: 'XX0000000004', nominal: 200_000, price: 100, valueUsd: 200_000, couponPct: 4.5, maturity: '2029-12-01', ytmPct: 4.5, durationYrs: 3.4, annualIncomeUsd: 9_000, group: 'Kurumsal tahvil', custodian: 'Example Bank' }),
        ],
    },
];

const snapshot = {
    asOf: AS_OF,
    sources: { excelModified: '2026-01-14T18:30:00Z', ibkrAsOf: '2026-01-14T21:00:00Z', pricesNote: 'Örnek fiyatlar — sentetik veri' },
    fx: { EURUSD: 1.1, USDTRY: 40 },
    totals: { marketUsd: 2_519_000, maturityUsd: 2_550_000, annualIncomeUsd: 92_950, accruedUsd: 15_000 },
    accounts,
    allocation: [
        { group: 'Kurumsal tahvil', valueUsd: 824_000, share: 0.327 },
        { group: 'Hisse ETF', valueUsd: 500_000, share: 0.198 },
        { group: 'Devlet tahvili', valueUsd: 495_000, share: 0.197 },
        { group: 'Nakit', valueUsd: 400_000, share: 0.159 },
        { group: 'Tahvil ETF', valueUsd: 300_000, share: 0.119 },
    ],
    monthlyIncome: [6_000, 4_000, 9_500, 6_000, 4_000, 13_000, 10_500, 4_000, 9_500, 6_000, 4_000, 16_450],
    notes: ['Önizleme verisi — gerçek portföy değildir.'],
};

/** Deterministic synthetic monthly index (2006–2025) with two drawdowns, levered by `k`. */
function syntheticSeries(k: number) {
    const out: { month: string; value: number }[] = [];
    let v = 100;
    for (let i = 0; i < 240; i++) {
        let r = 0.006 + 0.01 * Math.sin(i / 3);
        if (i >= 30 && i < 42) r = -0.04;
        if (i >= 42 && i < 60) r = 0.025;
        if (i >= 168 && i < 172) r = -0.05;
        v *= 1 + r * k - (k - 1) * 0.002;
        const y = 2006 + Math.floor(i / 12);
        out.push({ month: `${y}-${String((i % 12) + 1).padStart(2, '0')}`, value: Math.round(v * 10) / 10 });
    }
    return out;
}

function episodesOf(series: { month: string; value: number }[]) {
    const eps: { peak: string; trough: string; recovery: string | null; ddPct: number; fallMonths: number; recoveryMonths: number | null; totalMonths: number | null }[] = [];
    let peakI = 0;
    let troughI = 0;
    let inDd = false;
    for (let i = 1; i < series.length; i++) {
        const v = series[i].value;
        if (v >= series[peakI].value) {
            if (inDd) {
                const dd = series[troughI].value / series[peakI].value - 1;
                if (dd <= -0.1) {
                    eps.push({ peak: series[peakI].month, trough: series[troughI].month, recovery: series[i].month, ddPct: Math.round(dd * 1000) / 10, fallMonths: troughI - peakI, recoveryMonths: i - troughI, totalMonths: i - peakI });
                }
            }
            peakI = i;
            troughI = i;
            inDd = false;
        } else {
            inDd = true;
            if (v < series[troughI].value) troughI = i;
        }
    }
    if (inDd) {
        const dd = series[troughI].value / series[peakI].value - 1;
        if (dd <= -0.1) eps.push({ peak: series[peakI].month, trough: series[troughI].month, recovery: null, ddPct: Math.round(dd * 1000) / 10, fallMonths: troughI - peakI, recoveryMonths: null, totalMonths: null });
    }
    return eps;
}

const VARIANTS = { unlevered: 1, margin1m: 1.4, margin2m: 1.8 } as const;
const series = Object.fromEntries(Object.entries(VARIANTS).map(([k, lev]) => [k, syntheticSeries(lev)]));
const episodes = Object.fromEntries(Object.entries(series).map(([k, s]) => [k, episodesOf(s)]));
const maxDdPct = Object.fromEntries(Object.entries(episodes).map(([k, e]) => [k, Math.min(0, ...e.map((x) => x.ddPct))]));

/** Grows at `growth`, withdraws `draw` rising with `inflation`; floors at 0 (depletion). */
const projection = (policy: string, start: number, draw: number, growth: number, inflation = 0) => {
    let v = start;
    return {
        policy,
        points: Array.from({ length: 20 }, (_, i) => {
            if (i > 0) v = Math.max(0, v * (1 + growth) - draw * Math.pow(1 + inflation, i - 1));
            return { year: 2027 + i, incomePortfolioUsd: Math.round(v), cspxUsd: Math.round(500_000 * Math.pow(1.07, i)) };
        }),
    };
};

const incomePlan = {
    slug: 'income-example',
    title: 'Gelir planı (örnek)',
    subtitle: 'Kupon ağırlıklı, vade merdiveni — sentetik',
    asOf: AS_OF,
    account: 'both',
    summary: { grossIncomeUsd: 118_000, feesUsd: 6_000, netIncomeUsd: 112_000, currentFeesUsd: 9_000, expectedReturnPct: 4.8, durationYrs: 4.2, targetIncomeUsd: [100_000, 120_000] },
    targetHoldings: [
        h({ name: 'Example Treasury 4% 2028', valueUsd: 495_000, annualIncomeUsd: 20_000, group: 'Devlet tahvili', custodian: 'UBS' }),
        h({ name: 'Example Bond 5% 2030', valueUsd: 404_000, annualIncomeUsd: 20_000, group: 'Kurumsal tahvil', custodian: 'UBS' }),
        h({ name: 'Example Bond 5.5% 2034', valueUsd: 300_000, couponPct: 5.5, maturity: '2034-05-01', annualIncomeUsd: 16_500, group: 'Kurumsal tahvil', custodian: 'UBS' }),
        h({ name: 'Example Equity Index ETF', valueUsd: 250_000, annualIncomeUsd: 3_000, group: 'Hisse ETF', custodian: 'IBKR' }),
        h({ name: 'Example Short-Term Bond ETF', valueUsd: 300_000, annualIncomeUsd: 13_500, group: 'Tahvil ETF', custodian: 'IBKR' }),
        h({ name: 'Example Corporate Bond ETF', valueUsd: 300_000, annualIncomeUsd: 16_500, group: 'Tahvil ETF', custodian: 'IBKR' }),
        h({ name: 'Example Bond 4.5% 2029', valueUsd: 200_000, annualIncomeUsd: 9_000, group: 'Kurumsal tahvil', custodian: 'Example Bank' }),
        h({ name: 'Example Money Market Fund', valueUsd: 100_000, annualIncomeUsd: 4_500, group: 'Nakit', custodian: 'Example Bank' }),
        h({ name: 'Nakit USD', valueUsd: 150_000, group: 'Nakit', custodian: 'UBS' }),
    ],
    diff: [
        { action: 'sell', name: 'Example Bond 6% 2032', isin: 'XX0000000003', custodian: 'UBS', amountUsd: 220_000, nominal: 200_000, note: 'EUR riskini azalt' },
        { action: 'sell', name: 'Example Equity Index ETF', ticker: 'EXEQ', custodian: 'IBKR', amountUsd: 250_000, note: 'Hisse payını yarıya indir' },
        { action: 'sell', name: 'Example Money Market Fund', custodian: 'Example Bank', amountUsd: 150_000 },
        { action: 'buy', name: 'Example Bond 5.5% 2034', custodian: 'UBS', amountUsd: 300_000, nominal: 300_000, note: 'Vade merdiveni uzatılır' },
        { action: 'buy', name: 'Example Corporate Bond ETF', ticker: 'EXCB', custodian: 'IBKR', amountUsd: 300_000 },
        { action: 'keep', name: 'Example Treasury 4% 2028', custodian: 'UBS', amountUsd: 495_000 },
        { action: 'keep', name: 'Example Bond 5% 2030', custodian: 'UBS', amountUsd: 404_000 },
        { action: 'keep', name: 'Example Short-Term Bond ETF', custodian: 'IBKR', amountUsd: 300_000 },
        { action: 'transfer', name: 'Nakit USD', custodian: 'IBKR → UBS', amountUsd: 50_000, note: 'Hesaplar arası' },
    ],
    monthlyIncome: [8_000, 6_000, 12_000, 8_000, 6_000, 15_000, 12_000, 6_000, 12_000, 8_000, 6_000, 13_000],
    projections: [
        projection('Sabit çekim', 2_500_000, 100_000, 0.05),
        projection('Enflasyona bağlı çekim', 2_500_000, 190_000, 0.045, 0.04),
    ],
    drawdown: { series, maxDdPct, episodes },
    scenarios: [
        { name: '2008 tipi kriz', lossUsd: { unlevered: -300_000, margin1m: -450_000, margin2m: -600_000 }, recovery: '~36 ay' },
        { name: 'Faiz şoku +200bp', lossUsd: { unlevered: -150_000, margin1m: -200_000, margin2m: -250_000 }, recovery: '~18 ay' },
        { name: 'Hisse −%30', lossUsd: { unlevered: -75_000, margin1m: -180_000, margin2m: -290_000 }, recovery: '~24 ay' },
    ],
    risks: ['Faiz düşerse yeniden yatırım getirisi azalır.', 'Kurumsal kredi riski — ihraççı yoğunlaşmasına dikkat.'],
    steps: ['EUR tahvili sat.', 'Hisse ETF payını yarıya indir.', 'Yeni vade basamaklarını al.', 'Nakdi tek hesapta topla.'],
    assumptions: ['Kuponlar yeniden yatırılmaz.', 'Ücretler yıllık sabit varsayılır.'],
    documents: [
        { title: 'Plan özeti (örnek)', path: '/Example/Plans/gelir-plani-ornek.pdf' },
        { title: 'Hesap tablosu (örnek)', path: '/Example/Plans/gelir-plani-ornek.xlsx' },
    ],
};

const growthPlan = {
    slug: 'growth-example',
    title: 'Şirket büyüme planı (örnek)',
    subtitle: 'Şirket hesabı — sentetik',
    asOf: AS_OF,
    account: 'company',
    // Upper-case on purpose: matching is case-insensitive.
    scopeAccounts: ['ŞİRKET'],
    summary: { grossIncomeUsd: 14_000, feesUsd: 1_500, netIncomeUsd: 12_500, expectedReturnPct: 6.5 },
    targetHoldings: [
        h({ name: 'Example Equity Index ETF', valueUsd: 200_000, annualIncomeUsd: 2_400, group: 'Hisse ETF', custodian: 'IBKR' }),
        h({ name: 'Example Bond 4.5% 2029', valueUsd: 200_000, annualIncomeUsd: 9_000, group: 'Kurumsal tahvil', custodian: 'Example Bank' }),
        h({ name: 'Example Money Market Fund', valueUsd: 50_000, annualIncomeUsd: 2_250, group: 'Nakit', custodian: 'Example Bank' }),
    ],
    diff: [
        { action: 'sell', name: 'Example Money Market Fund', custodian: 'Example Bank', amountUsd: 200_000 },
        { action: 'buy', name: 'Example Equity Index ETF', ticker: 'EXEQ', custodian: 'IBKR', amountUsd: 200_000 },
        { action: 'keep', name: 'Example Bond 4.5% 2029', custodian: 'Example Bank', amountUsd: 200_000 },
    ],
    projections: [projection('Büyüme (çekimsiz)', 450_000, 0, 0.065)],
    documents: [{ title: 'Şirket planı (örnek)', path: '/Example/Plans/sirket-plani-ornek.pdf' }],
};

export const MOCK_ROWS: PortfolioDocumentRow[] = [
    { kind: 'snapshot', slug: 'current', as_of: AS_OF, payload: snapshot },
    { kind: 'plan', slug: incomePlan.slug, as_of: AS_OF, payload: incomePlan },
    { kind: 'plan', slug: growthPlan.slug, as_of: AS_OF, payload: growthPlan },
];

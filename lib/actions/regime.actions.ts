'use server';

/**
 * AI Market Regime — fuses several real, computed signals (from Stooq EOD
 * closes) plus the live Crypto Fear & Greed index into a single risk verdict,
 * and asks DeepSeek for a plain-language "why". This is the synthesis layer:
 * the values are computed deterministically; the AI only narrates them.
 */

import { fetchStooqCloses } from '@/lib/actions/returns.actions';
import { getCryptoFearGreed } from '@/lib/actions/market-mood.actions';

export type SignalState = 'on' | 'neutral' | 'off';

export interface RegimeSignal {
    label: string;
    state: SignalState;
    detail: string;
}

export interface MarketRegime {
    verdict: 'Risk-On' | 'Neutral' | 'Risk-Off' | 'Stress';
    score: number; // 0 (max risk-off) … 100 (max risk-on)
    signals: RegimeSignal[];
    narrative: string | null;
    asOf: string;
}

const SECTORS = ['XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU', 'XLB', 'XLRE', 'XLC'];

function sma(closes: number[], n: number): number | null {
    if (closes.length < n) return null;
    const slice = closes.slice(closes.length - n);
    return slice.reduce((a, b) => a + b, 0) / n;
}
function ret(closes: number[], back: number): number | null {
    const i = closes.length - 1 - back;
    if (i < 0) return null;
    const past = closes[i];
    return past > 0 ? (closes[closes.length - 1] / past - 1) * 100 : null;
}

async function closesOf(symbol: string): Promise<number[]> {
    try {
        return (await fetchStooqCloses(symbol)).map((c) => c.close);
    } catch {
        return [];
    }
}

function verdictFor(sum: number, max: number, stress: boolean): MarketRegime['verdict'] {
    if (stress) return 'Stress';
    const ratio = sum / max;
    if (ratio >= 0.34) return 'Risk-On';
    if (ratio <= -0.34) return 'Risk-Off';
    return 'Neutral';
}

export async function getMarketRegime(): Promise<MarketRegime | null> {
    const [spy, qqq, hyg, lqd, fng, ...sectors] = await Promise.all([
        closesOf('AMEX:SPY'),
        closesOf('NASDAQ:QQQ'),
        closesOf('AMEX:HYG'),
        closesOf('AMEX:LQD'),
        getCryptoFearGreed().catch(() => null),
        ...SECTORS.map((s) => closesOf(`AMEX:${s}`)),
    ]);

    if (spy.length < 200) return null; // can't compute the core trend → bail

    const signals: RegimeSignal[] = [];

    // 1) Trend — S&P vs 200DMA
    const spy200 = sma(spy, 200)!;
    const spyLast = spy[spy.length - 1];
    signals.push({
        label: 'Trend (S&P vs 200DMA)',
        state: spyLast > spy200 ? 'on' : 'off',
        detail: spyLast > spy200 ? 'S&P 500 above its 200-day average' : 'S&P 500 below its 200-day average',
    });

    // 2) Golden / Death cross
    const spy50 = sma(spy, 50);
    if (spy50 != null) {
        signals.push({
            label: '50/200DMA cross',
            state: spy50 > spy200 ? 'on' : 'off',
            detail: spy50 > spy200 ? 'Golden cross (50 above 200)' : 'Death cross (50 below 200)',
        });
    }

    // 3) Momentum — 3M return
    const mom = ret(spy, 63);
    if (mom != null) {
        signals.push({
            label: 'Momentum (3M)',
            state: mom > 1 ? 'on' : mom < -1 ? 'off' : 'neutral',
            detail: `S&P 3-month return ${mom >= 0 ? '+' : ''}${mom.toFixed(1)}%`,
        });
    }

    // 4) Breadth — sectors above their 200DMA
    const valid = sectors.filter((s) => s.length >= 200);
    if (valid.length >= 6) {
        const above = valid.filter((s) => s[s.length - 1] > (sma(s, 200) as number)).length;
        const pct = (above / valid.length) * 100;
        signals.push({
            label: 'Breadth (sectors > 200DMA)',
            state: pct > 60 ? 'on' : pct < 40 ? 'off' : 'neutral',
            detail: `${above}/${valid.length} sectors above their 200-day average`,
        });
    }

    // 5) Credit — high yield vs investment grade (1M relative)
    const hy = ret(hyg, 21);
    const ig = ret(lqd, 21);
    if (hy != null && ig != null) {
        const diff = hy - ig;
        signals.push({
            label: 'Credit (HY vs IG)',
            state: diff > 0.25 ? 'on' : diff < -0.25 ? 'off' : 'neutral',
            detail:
                diff >= 0
                    ? 'High-yield outperforming investment-grade (calm credit)'
                    : 'High-yield lagging investment-grade (credit stress)',
        });
    }

    // 6) Growth leadership — QQQ vs SPY (1M relative)
    const q = ret(qqq, 21);
    const s = ret(spy, 21);
    if (q != null && s != null) {
        signals.push({
            label: 'Leadership (Nasdaq vs S&P)',
            state: q - s > 0.25 ? 'on' : q - s < -0.25 ? 'off' : 'neutral',
            detail: q - s >= 0 ? 'Growth/tech leading' : 'Defensives leading',
        });
    }

    // 7) Crypto Fear & Greed
    if (fng) {
        signals.push({
            label: 'Crypto Fear & Greed',
            state: fng.value >= 55 ? 'on' : fng.value <= 45 ? 'off' : 'neutral',
            detail: `${fng.value} — ${fng.classification}`,
        });
    }

    const sum = signals.reduce((a, sig) => a + (sig.state === 'on' ? 1 : sig.state === 'off' ? -1 : 0), 0);
    const max = signals.length;
    const trendOff = signals[0]?.state === 'off';
    const creditOff = signals.find((x) => x.label.startsWith('Credit'))?.state === 'off';
    const breadthOff = signals.find((x) => x.label.startsWith('Breadth'))?.state === 'off';
    const stress = trendOff && creditOff && breadthOff;

    const verdict = verdictFor(sum, max, stress);
    const score = Math.round(((sum + max) / (2 * max)) * 100);

    const narrative = await regimeNarrative(verdict, signals);

    return {
        verdict,
        score,
        signals,
        narrative,
        asOf: new Date().toISOString().slice(0, 10),
    };
}

async function regimeNarrative(
    verdict: string,
    signals: RegimeSignal[]
): Promise<string | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) return null;
    try {
        const summary = signals.map((s) => `- ${s.label}: ${s.state.toUpperCase()} (${s.detail})`).join('\n');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a concise markets strategist. Given a computed market-regime verdict and its ' +
                            'underlying signals, explain in 2-3 plain sentences what this regime means and what is ' +
                            'driving it. Use ONLY the signals provided; no invented numbers, no advice. Respond ONLY ' +
                            'as JSON: {"narrative": "..."}',
                    },
                    { role: 'user', content: `Verdict: ${verdict}\nSignals:\n${summary}` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 250,
                stream: false,
            }),
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = (json.choices?.[0]?.message?.content ?? '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(content) as { narrative?: unknown };
        return parsed?.narrative ? String(parsed.narrative) : null;
    } catch {
        return null;
    }
}

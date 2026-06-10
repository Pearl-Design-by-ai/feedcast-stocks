'use server';

/**
 * Proxy shim → PRIVATE markets-engine.
 *
 * The real implementations (AI prompts, caching, grounding) live in the
 * separate, closed-source engine. This file only forwards calls over the
 * engine's HTTP API and preserves the original signatures/types so the
 * components that import them are unchanged. See `lib/engine-client.ts`.
 */

import { engineGet, enginePost } from '@/lib/engine-client';
import { isTickerLike, sanitizeSymbols } from '@/lib/utils';

export interface IndicatorExplanation {
    summary: string;
    importance: string;
    watch: string;
    when: string;
}

export type ExplainResult =
    | { ok: true; data: IndicatorExplanation }
    | { ok: false; error: string };

export interface MarketBrief {
    points: string[];
}

export interface CompanyBrief {
    text: string;
}

export interface BullBear {
    bull: string[];
    bear: string[];
}

export interface XrayHolding {
    symbol: string;
    weight: number;
}

export interface NewsImpactItem {
    headline: string;
    symbol: string;
    impact: 'positive' | 'negative' | 'neutral';
}

export async function explainIndicator(
    name: string,
    blurb: string,
    category?: string
): Promise<ExplainResult> {
    return enginePost<ExplainResult>(
        '/v1/indicator/explain',
        { name, blurb, category },
        { ok: false, error: 'AI explanations are not configured yet.' }
    );
}

export async function getMarketBrief(): Promise<MarketBrief | null> {
    return engineGet<MarketBrief | null>('/v1/market/brief', {}, null);
}

export async function getCompanyBrief(symbol: string, name: string): Promise<CompanyBrief | null> {
    if (!isTickerLike(symbol)) return null;
    return engineGet<CompanyBrief | null>('/v1/company/brief', { symbol, name }, null);
}

export async function getWatchlistDigest(symbols: string[]): Promise<MarketBrief | null> {
    // Cap and validate — an oversized or junk-filled list shouldn't reach the engine.
    const clean = sanitizeSymbols(symbols);
    if (clean.length === 0) return null;
    return enginePost<MarketBrief | null>('/v1/watchlist/digest', { symbols: clean }, null);
}

export async function getBullBear(symbol: string, name: string): Promise<BullBear | null> {
    if (!isTickerLike(symbol)) return null;
    return engineGet<BullBear | null>('/v1/company/bullbear', { symbol, name }, null);
}

export async function getPortfolioXray(holdings: XrayHolding[]): Promise<MarketBrief | null> {
    const clean = (holdings ?? [])
        .filter((h) => isTickerLike(h.symbol) && Number.isFinite(h.weight))
        .slice(0, 100);
    if (clean.length === 0) return null;
    return enginePost<MarketBrief | null>('/v1/portfolio/xray', { holdings: clean }, null);
}

export async function getNewsImpact(symbols: string[]): Promise<NewsImpactItem[] | null> {
    const clean = sanitizeSymbols(symbols);
    if (clean.length === 0) return null;
    return enginePost<NewsImpactItem[] | null>('/v1/news/impact', { symbols: clean }, null);
}

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
import { getCurrentUser } from '@/lib/supabase/server';

// Company display name is grounding-only; `symbol` identifies the company. It
// rides in the engine cache key, so bound + normalize it: a legit name passes
// through unchanged (stable per symbol → normal cache hit), while junk/oversized
// values can't inject unbounded entropy to force cache-miss LLM regenerations.
function cleanCompanyName(name: string): string {
    return String(name ?? '')
        .replace(/[^A-Za-z0-9 .,&'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
}

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

export interface ConsensusSection {
    title: string;
    body: string;
}

export interface Consensus {
    sections: ConsensusSection[];
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
    // Members-only: on-demand "Explain" button hits the engine's LLM, so it
    // can't be triggered anonymously (cost / abuse). The indicator catalog
    // itself stays public for SEO.
    if (!(await getCurrentUser())) {
        return { ok: false, error: 'Please sign in to get an AI explanation.' };
    }
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
    return engineGet<CompanyBrief | null>('/v1/company/brief', { symbol, name: cleanCompanyName(name) }, null);
}

export async function getWatchlistDigest(symbols: string[]): Promise<MarketBrief | null> {
    // Members-only: watchlist digest is a personalized on-demand LLM call.
    if (!(await getCurrentUser())) return null;
    // Cap and validate — an oversized or junk-filled list shouldn't reach the engine.
    const clean = sanitizeSymbols(symbols);
    if (clean.length === 0) return null;
    return enginePost<MarketBrief | null>('/v1/watchlist/digest', { symbols: clean }, null);
}

export async function getBullBear(symbol: string, name: string): Promise<BullBear | null> {
    // Members-only: on-demand "Bull vs Bear" button triggers an LLM call.
    if (!(await getCurrentUser())) return null;
    if (!isTickerLike(symbol)) return null;
    return engineGet<BullBear | null>('/v1/company/bullbear', { symbol, name: cleanCompanyName(name) }, null);
}


export async function getConsensus(symbol: string, name: string): Promise<Consensus | null> {
    if (!isTickerLike(symbol)) return null;
    return engineGet<Consensus | null>('/v1/company/consensus', { symbol, name: cleanCompanyName(name) }, null);
}

export async function getNewsImpact(symbols: string[]): Promise<NewsImpactItem[] | null> {
    // Members-only: personalized news-impact digest triggers an LLM fan-out.
    if (!(await getCurrentUser())) return null;
    const clean = sanitizeSymbols(symbols);
    if (clean.length === 0) return null;
    return enginePost<NewsImpactItem[] | null>('/v1/news/impact', { symbols: clean }, null);
}

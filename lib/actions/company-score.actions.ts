'use server';

/**
 * Proxy shim → PRIVATE markets-engine for the FeedCast Company Score: a
 * transparent, deterministic multi-factor rating (Quality, Growth, Valuation,
 * Momentum, Financial Health → composite). Computed and KV-cached in the engine;
 * this is a thin read. Educational only, not investment advice.
 */

import { engineGet } from '@/lib/engine-client';

export interface ScoreInput {
    label: string;
    value: number | null;
    score: number | null;
    unit?: string;
}

export interface ScorePillar {
    key: 'quality' | 'growth' | 'valuation' | 'momentum' | 'health';
    label: string;
    score: number | null;
    weight: number;
    inputs: ScoreInput[];
}

export interface CompanyScore {
    symbol: string;
    overall: number | null;
    grade: string;
    pillars: ScorePillar[];
    asOf: string;
    coverage: number;
}

export async function getCompanyScore(symbol: string): Promise<CompanyScore | null> {
    const clean = symbol.toUpperCase().trim();
    if (!clean) return null;
    return engineGet<CompanyScore | null>('/v1/company/score', { symbol: clean }, null);
}

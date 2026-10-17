/**
 * Server-side read of the owner's private portfolio. Uses the caller's session
 * client, so RLS (auth.uid() = user_id) scopes the rows; there is deliberately
 * no API route exposing this data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { parseDocuments } from './parse';
import type { PrivatePortfolioData } from './types';

export async function loadPrivatePortfolio(supabase: SupabaseClient, userId: string): Promise<PrivatePortfolioData> {
    try {
        const { data, error } = await supabase
            .from('private_portfolio_documents')
            .select('kind, slug, as_of, payload, updated_at')
            .eq('user_id', userId);
        if (error) {
            console.error('[my-portfolio] read failed:', error.code ?? error.message);
            return { snapshot: null, plans: [] };
        }
        return parseDocuments(data);
    } catch (e) {
        console.error('[my-portfolio] read failed:', e instanceof Error ? e.message : 'unknown');
        return { snapshot: null, plans: [] };
    }
}

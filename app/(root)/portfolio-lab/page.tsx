import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Gauge } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import DataDisclaimer from '@/components/DataDisclaimer';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import PortfolioLens from '@/components/portfolio/PortfolioLens';

export const metadata: Metadata = {
    title: 'Portfolio Labs',
    description:
        'A cycle-aware, value-oriented portfolio builder. Assemble your tickers and weights, then get a per-stock 5-step analysis (position, thesis, key risk, cycle & valuation, judgment) plus a portfolio-level Health Score, cycle exposure and concentration risks.',
};

export default async function PortfolioLabPage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('https://www.feedcast.news/?signin=stocks');

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            <header className="mb-6">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <Gauge className="text-teal-400" /> Portfolio Labs
                </h1>
                <p className="mt-1 max-w-3xl text-base font-semibold text-gray-200">How healthy and balanced is this basket?</p>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-400">
                    A disciplined, cycle-aware portfolio builder. Assemble your tickers and weights, and it
                    runs each name through a 5-step value framework — current position, growth thesis, the one
                    thing holding it back (capex/FCF/ROIC), cycle &amp; valuation, and an overall judgment —
                    then reads the basket as a whole: a Health Score, cycle exposure, concentration and
                    diversification ideas. Hypothetical and educational — not investment advice.
                </p>
            </header>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <ScoreMethodology
                className="mb-6"
                methodology="Each holding is run through a 5-step value framework — current position, growth thesis, the one thing holding it back (capex / FCF / ROIC), cycle & valuation, and an overall judgment — then the basket is read as a whole for a Health Score, cycle exposure, concentration and diversification ideas. The per-name and portfolio reads are AI-generated and grounded in price + fundamentals."
                cadence="Analysis runs on demand when you press Analyze; the underlying per-stock Consensus is cached and refreshes on a multi-hour cadence."
                thresholds="The Health Score is 0–100 (higher = better balanced and more resilient); the rationale, cycle-exposure and concentration notes explain the bands. Hypothetical and educational — not investment advice."
            />

            <PortfolioLens />
        </div>
    );
}

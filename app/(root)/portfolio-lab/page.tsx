import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import DataDisclaimer from '@/components/DataDisclaimer';
import PortfolioLab from '@/components/portfolio/PortfolioLab';

export const metadata: Metadata = {
    title: 'Portfolio Lab',
    description:
        'Construct a biased, mandate-driven portfolio — growth, income, conservative or thematic — with transparent allocation logic, risk notes and deployable code.',
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
                    <Briefcase className="text-teal-400" /> Portfolio Lab
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-400">
                    A transparent, mandate-driven portfolio builder. Pick a bias (growth, income,
                    conservative or thematic), set your constraints, and it constructs a biased
                    allocation — holdings with rationale, sector/region breakdown, a capital-deployment
                    plan from live prices, risk notes and the allocation code. Hypothetical and
                    educational — not investment advice, no performance claims.
                </p>
            </header>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <PortfolioLab />
        </div>
    );
}

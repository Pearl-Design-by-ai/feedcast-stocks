import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BriefcaseBusiness } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { canViewPrivatePortfolio, resolveDevFlags } from '@/lib/private-portfolio/gate';
import { loadPrivatePortfolio } from '@/lib/private-portfolio/data';
import { parseDocuments } from '@/lib/private-portfolio/parse';
import { fmtDateTime } from '@/lib/private-portfolio/format';
import type { PrivatePortfolioData } from '@/lib/private-portfolio/types';
import { EmptyState, PlanPicker, TabNav, isTabId, type TabId } from '@/components/private-portfolio/ui';
import OverviewTab from '@/components/private-portfolio/OverviewTab';
import CompareTab from '@/components/private-portfolio/CompareTab';
import IncomeTab from '@/components/private-portfolio/IncomeTab';
import ScenarioTab from '@/components/private-portfolio/ScenarioTab';
import DocumentsTab from '@/components/private-portfolio/DocumentsTab';

// Owner-only, per-request, never cached or indexed.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'My Portfolio',
    robots: { index: false, follow: false },
};

// Dev-only synthetic preview. The literal NODE_ENV check is inlined at build
// time, so production bundles drop this branch — and the mock module — entirely.
async function loadMockData(): Promise<PrivatePortfolioData | null> {
    if (process.env.NODE_ENV !== 'production') {
        const { MOCK_ROWS } = await import('@/lib/private-portfolio/mock');
        return parseDocuments(MOCK_ROWS);
    }
    return null;
}

export default async function MyPortfolioPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; plan?: string }>;
}) {
    const dev = resolveDevFlags(process.env);

    // Power-user-only, hidden (404) for everyone else.
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!dev.noAuth && !canViewPrivatePortfolio(user)) notFound();

    let data = dev.mock ? await loadMockData() : null;
    if (!data) {
        if (!user) notFound();
        data = await loadPrivatePortfolio(supabase, user.id);
    }

    const { snapshot, plans } = data;
    const sp = await searchParams;
    const tab: TabId = isTabId(sp.tab) ? sp.tab : 'overview';
    const plan = plans.find((p) => p.slug === sp.plan) ?? plans[0] ?? null;

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <BriefcaseBusiness className="text-teal-400" /> Portföyüm
                </h1>
                <p className="max-w-3xl text-sm text-gray-400">
                    Likit portföyün güncel durumu ve önerilen planlarla karşılaştırması. Yalnızca sana görünür.
                    {snapshot && (
                        <>
                            {' '}Son senkron <span className="text-gray-300 tabular-nums">{fmtDateTime(snapshot.asOf)}</span>.
                        </>
                    )}
                </p>
                {dev.mock && <p className="text-xs font-semibold text-amber-400">Önizleme modu — sentetik veri (PRIVATE_PORTFOLIO_MOCK).</p>}
            </header>

            {!snapshot && !plans.length ? (
                <EmptyState>Veri henüz senkronize edilmedi.</EmptyState>
            ) : (
                <>
                    <TabNav active={tab} plan={plan?.slug} />
                    {tab !== 'overview' && tab !== 'documents' && plan && <PlanPicker plans={plans} active={plan} tab={tab} />}

                    {tab === 'overview' &&
                        (snapshot ? <OverviewTab snapshot={snapshot} /> : <EmptyState>Veri henüz senkronize edilmedi.</EmptyState>)}
                    {tab === 'compare' && (plan ? <CompareTab snapshot={snapshot} plan={plan} /> : <EmptyState>Henüz plan yok.</EmptyState>)}
                    {tab === 'income' && <IncomeTab snapshot={snapshot} plan={plan} />}
                    {tab === 'scenarios' && (plan ? <ScenarioTab plan={plan} /> : <EmptyState>Henüz plan yok.</EmptyState>)}
                    {tab === 'documents' && <DocumentsTab plans={plans} />}
                </>
            )}

            <p className="mt-auto border-t border-gray-800 pt-4 text-xs text-gray-500">
                Yorumdur, yatırım tavsiyesi değildir. Veriler: Excel + IBKR senkronu.
            </p>
        </div>
    );
}

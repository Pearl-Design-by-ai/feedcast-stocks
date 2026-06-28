import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, Scale } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import { ValuationLists } from '@/components/bubble/ValuationScreen';
import MarketContext from '@/components/valuation/MarketContext';
import { ensureFreshScreen } from '@/lib/actions/valuation.actions';

export const metadata: Metadata = {
    title: 'Valuation',
    description:
        'The cheapest and most expensive major US stocks by trailing P/E — a daily valuation screen across ~190 large-caps.',
};

async function ValuationSection() {
    const screen = await ensureFreshScreen();
    return <ValuationLists screen={screen} />;
}

function ValuationSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            Loading the valuation screen…
        </div>
    );
}

export default function ValuationPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            <header className="mb-6">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
                    <Scale className="text-teal-400" /> Valuation
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-400">
                    Two views in one place. First the <span className="text-gray-200">whole-market read</span> —
                    broad valuation gauges, which sectors look cheap vs expensive, and where the rotation
                    may go next. Then the live <span className="text-gray-200">per-stock screen</span>: a daily
                    batch ranks ~230 major US stocks by trailing P/E to surface the{' '}
                    <span className="text-emerald-400">cheapest 100</span> and{' '}
                    <span className="text-red-400">most expensive 100</span> (with P/S and dividend yield
                    alongside), rebuilt automatically after each US market close.
                </p>
            </header>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <div className="mb-8">
                <MarketContext />
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-100">Cheapest &amp; most expensive stocks</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                    Live per-stock screen — ranked by trailing P/E across ~230 large-caps.
                </p>
            </div>

            <Suspense fallback={<ValuationSkeleton />}>
                <ValuationSection />
            </Suspense>
        </div>
    );
}

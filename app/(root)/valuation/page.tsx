import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, Scale } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import { ValuationLists } from '@/components/bubble/ValuationScreen';
import { ensureFreshScreen } from '@/lib/actions/valuation.actions';

export const metadata: Metadata = {
    title: 'Valuation Screen',
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
                    <Scale className="text-teal-400" /> Valuation Screen
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-400">
                    A daily batch ranks ~190 major US stocks by valuation to surface the{' '}
                    <span className="text-emerald-400">cheapest 100</span> and{' '}
                    <span className="text-red-400">most expensive 100</span>. The market-wide{' '}
                    <a
                        href="https://www.multpl.com/shiller-pe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline"
                    >
                        Shiller CAPE
                    </a>{' '}
                    isn&apos;t computable per stock from free data, so each name is ranked by its
                    trailing P/E — the accessible valuation proxy — with P/S and dividend yield
                    alongside. Rebuilt automatically after each US market close.
                </p>
            </header>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <Suspense fallback={<ValuationSkeleton />}>
                <ValuationSection />
            </Suspense>
        </div>
    );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, Scale } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import RelatedLinks from '@/components/common/RelatedLinks';
import { ValuationLists } from '@/components/bubble/ValuationScreen';
import MarketContext from '@/components/valuation/MarketContext';
import { ensureFreshScreen } from '@/lib/actions/valuation.actions';

export const metadata: Metadata = {
    title: 'Valuation',
    description:
        'The cheapest and most expensive major US stocks by trailing and forward P/E — a daily valuation screen across ~230 large-caps.',
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
                <p className="mt-1 max-w-3xl text-base font-semibold text-gray-200">Where is price rich, and where is it cheap?</p>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-400">
                    Two views in one place. First the <span className="text-gray-200">whole-market read</span> —
                    broad valuation gauges, which sectors look cheap vs expensive, and where the rotation
                    may go next. Then the live <span className="text-gray-200">per-stock screen</span>: a daily
                    batch ranks ~230 major US stocks by{' '}
                    <span className="text-gray-200">trailing or forward P/E</span> — your choice — to surface the{' '}
                    <span className="text-emerald-400">cheapest 100</span> and{' '}
                    <span className="text-red-400">most expensive 100</span> (with P/S and dividend yield
                    alongside), rebuilt automatically after each US market close.
                </p>
            </header>

            <DataDisclaimer className="mb-6 max-w-2xl" />

            <ScoreMethodology
                className="mb-6"
                methodology="Two layers. The whole-market read shows broad valuation gauges and relative sector cheapness. The per-stock screen ranks ~230 major US large-caps by trailing P/E — or, on the same universe, by forward P/E (price ÷ next-twelve-month consensus earnings) — with P/S and dividend yield alongside, to surface the cheapest and most expensive names. Low P/E is not automatically “cheap” — pair it with the quality and cycle context; a forward multiple additionally rests on analyst estimates that can be revised."
                cadence="The per-stock screen is rebuilt by a daily batch automatically after each US market close; the whole-market gauges refresh on a similar daily cadence."
                thresholds="Ranking is relative, not absolute: the cheapest 100 and most expensive 100 within the universe, on whichever multiple you rank by. Names without positive trailing earnings drop out of the trailing ranking; names without a positive forward estimate drop out of the forward one — so the two lists are not the same set."
            />

            <div className="mb-8">
                <MarketContext />
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-100">Cheapest &amp; most expensive stocks</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                    Live per-stock screen across ~230 large-caps — rank it by trailing P/E or forward P/E.
                </p>
            </div>

            <Suspense fallback={<ValuationSkeleton />}>
                <ValuationSection />
            </Suspense>

            <div className="mt-6">
                <RelatedLinks
                    items={[
                        { href: '/screener', label: 'Screener', desc: 'Filter the whole market by valuation, performance & technicals' },
                        { href: '/compare', label: 'Compare', desc: 'Put cheap vs expensive names side by side' },
                        { href: '/bubble-detector', label: 'Bubble Detector', desc: 'Check if the expensive names are also frothy' },
                        { href: '/watchlist', label: 'Watchlists', desc: 'Save the names you want to value over time' },
                    ]}
                />
            </div>
        </div>
    );
}

import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import ScoreMethodology from '@/components/common/ScoreMethodology';
import RelatedLinks from '@/components/common/RelatedLinks';
import MarketRegimeView from '@/components/markets/MarketRegimeView';

export const metadata: Metadata = {
    title: 'Market Regime',
    description:
        'An AI-narrated market-regime gauge that fuses trend, breadth, momentum, credit and sentiment signals into a single risk verdict.',
};

export default function MarketRegimePage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Market Regime</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">Is the tape risk-on or risk-off right now?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        One read on the whole market. We compute several real signals — the S&amp;P
                        trend, the 50/200 cross, momentum, sector breadth, credit (high-yield vs
                        investment-grade), growth leadership and the Crypto Fear &amp; Greed index —
                        fuse them into a risk verdict, and let AI explain what&apos;s driving it.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <ScoreMethodology
                methodology="A single risk verdict fused from several live signals — the S&P 500 trend, the 50/200 cross, momentum, sector breadth, credit (high-yield vs investment-grade), growth leadership and the Crypto Fear & Greed index — each scored and combined, with AI narrating what is driving it."
                cadence="Recomputed from end-of-day data on each visit (cached a few minutes); the verdict shifts about once per trading day after the US close."
                thresholds="Signals net out to a Risk-On / Neutral / Risk-Off verdict: Risk-On = trend up, breadth and credit healthy; Risk-Off = price below key averages with weak breadth and widening credit; Neutral = mixed."
            />

            <AiCommentary />

            <Suspense
                fallback={
                    <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                        Computing the current regime…
                    </div>
                }
            >
                <MarketRegimeView />
            </Suspense>

            <RelatedLinks
                items={[
                    { href: '/buy-sell-signals', label: 'Buy & Sell Signals', desc: 'Turn the regime into graded index calls' },
                    { href: '/crash-detector', label: 'Crash Detector', desc: 'How much cycle risk sits under the tape' },
                    { href: '/sectors', label: 'Sectors', desc: 'See which sectors are leading the current regime' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Read your own names against the backdrop' },
                ]}
            />
        </div>
    );
}

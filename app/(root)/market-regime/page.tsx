import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
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
                    <p className="max-w-3xl text-sm text-gray-400">
                        One read on the whole market. We compute several real signals — the S&amp;P
                        trend, the 50/200 cross, momentum, sector breadth, credit (high-yield vs
                        investment-grade), growth leadership and the Crypto Fear &amp; Greed index —
                        fuse them into a risk verdict, and let AI explain what&apos;s driving it.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
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
        </div>
    );
}

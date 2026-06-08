import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import Compare from '@/components/compare/Compare';

export const metadata: Metadata = {
    title: 'Compare',
    description: 'Overlay and compare the performance of multiple symbols on one chart.',
};

export default function ComparePage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Compare</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Overlay 2–6 symbols on one chart to compare their relative performance. The
                        first symbol is the base; the rest are added as comparisons.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <Compare />
        </div>
    );
}

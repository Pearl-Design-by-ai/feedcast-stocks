import type { Metadata } from 'next';
import AskMarkets from '@/components/ask/AskMarkets';

export const metadata: Metadata = {
    title: 'Ask the Markets',
    description: 'A grounded AI assistant that answers market questions using live regime and news context.',
};

export default function AskPage() {
    return (
        <div className="flex min-h-screen w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-100">Ask the Markets</h1>
                <p className="text-sm text-gray-400">
                    A grounded AI assistant — it answers from the current market regime and
                    today&apos;s headlines, not a stale model memory. Pick a topic, tap a
                    question, get a straight answer.
                </p>
            </header>

            <AskMarkets />
        </div>
    );
}

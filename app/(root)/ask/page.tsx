import type { Metadata } from 'next';
import AskMarkets from '@/components/ask/AskMarkets';

export const metadata: Metadata = {
    title: 'Ask the Markets',
    description: 'A grounded AI assistant that answers market questions using live regime and news context.',
};

export default function AskPage() {
    return (
        <div className="mx-auto w-full max-w-3xl">
            <AskMarkets />
        </div>
    );
}

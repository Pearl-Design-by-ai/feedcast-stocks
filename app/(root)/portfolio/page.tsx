import type { Metadata } from 'next';
import DataDisclaimer from '@/components/DataDisclaimer';
import Portfolio from '@/components/portfolio/Portfolio';

export const metadata: Metadata = {
    title: 'Portfolio',
    description: 'Track your holdings and live profit / loss.',
};

export default function PortfolioPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Portfolio</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Add your holdings to track live market value and profit / loss. Positions
                        are saved on this device (in your browser) — nothing is sent to a server.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <Portfolio />
        </div>
    );
}

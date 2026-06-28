import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import RelatedLinks from '@/components/common/RelatedLinks';
import TradingViewWidget from '@/components/TradingViewWidget';
import { SCREENER_WIDGET_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Screener',
    description:
        'Screen US stocks by price, performance, valuation and technicals to surface ideas and movers.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default function ScreenerPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Screener</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">Which stocks are worth a closer look right now?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Filter US stocks by performance, valuation and technicals to surface movers
                        and ideas. Switch the column set and preset screens from the toolbar.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-2 text-base font-semibold text-gray-100">How to use this screen</h2>
                <ul className="grid grid-cols-1 gap-1.5 text-[13px] leading-relaxed text-gray-400 sm:grid-cols-2">
                    <li><span className="font-semibold text-gray-300">Hunting value?</span> Sort by low P/E, then sanity-check growth and margins — cheap alone is a trap.</li>
                    <li><span className="font-semibold text-gray-300">Chasing momentum?</span> Filter near 52-week highs with strong 1-/3-month performance and rising volume.</li>
                    <li><span className="font-semibold text-gray-300">Looking for movers?</span> Sort by today&apos;s % change or volume to catch what the tape is reacting to.</li>
                    <li><span className="font-semibold text-gray-300">Then confirm context.</span> A raw screen is a starting list — pair each name with Valuation and the Bubble Detector before acting.</li>
                </ul>
            </section>

            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}screener.js`}
                    config={SCREENER_WIDGET_CONFIG}
                    height={650}
                />
            </div>

            <RelatedLinks
                items={[
                    { href: '/valuation', label: 'Valuation', desc: 'See where the whole market is rich vs cheap' },
                    { href: '/compare', label: 'Compare', desc: 'Overlay your shortlist on one chart' },
                    { href: '/watchlist', label: 'Watchlists', desc: 'Save the names you surfaced to track them' },
                    { href: '/bubble-detector', label: 'Bubble Detector', desc: 'Check froth before chasing a breakout' },
                ]}
            />
        </div>
    );
}

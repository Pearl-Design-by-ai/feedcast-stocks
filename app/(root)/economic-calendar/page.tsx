import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import DataDisclaimer from '@/components/DataDisclaimer';
import RelatedLinks from '@/components/common/RelatedLinks';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ECONOMIC_CALENDAR_WIDGET_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Economic Calendar',
    description:
        'Upcoming macro events that move markets — CPI, central-bank rate decisions, jobs reports and more, by country and importance.',
};

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default function EconomicCalendarPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Economic Calendar</h1>
                    <p className="max-w-3xl text-base font-semibold text-gray-200">What macro could move the tape next?</p>
                    <p className="max-w-3xl text-sm text-gray-400">
                        The macro events that move markets — inflation prints, central-bank rate
                        decisions, jobs reports and growth data — across major economies, filtered
                        to medium and high importance.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-2 text-base font-semibold text-gray-100">Why these events matter</h2>
                <ul className="grid grid-cols-1 gap-1.5 text-[13px] leading-relaxed text-gray-400 sm:grid-cols-2">
                    <li><span className="font-semibold text-gray-300">CPI &amp; inflation:</span> the biggest single driver of rate expectations — a hot print can flip the regime risk-off fast.</li>
                    <li><span className="font-semibold text-gray-300">Central-bank decisions:</span> the rate path and the tone of the statement reprice everything from bonds to growth stocks.</li>
                    <li><span className="font-semibold text-gray-300">Jobs &amp; growth:</span> the labor market and GDP set the recession-vs-soft-landing debate the cycle hinges on.</li>
                    <li><span className="font-semibold text-gray-300">High-importance flags:</span> focus there first — those are the prints most likely to move the whole tape, not just one sector.</li>
                </ul>
            </section>

            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <TradingViewWidget
                    scriptUrl={`${SCRIPT}events.js`}
                    config={ECONOMIC_CALENDAR_WIDGET_CONFIG}
                    height={650}
                />
            </div>

            <RelatedLinks
                items={[
                    { href: '/market-regime', label: 'Market Regime', desc: 'How a print might shift the risk-on / risk-off read' },
                    { href: '/crash-detector', label: 'Crash Detector', desc: 'Where macro stress sits in the cycle' },
                    { href: '/market-indicators', label: 'Market Indicators', desc: 'Rates, credit & macro internals in one place' },
                    { href: '/fixed-income', label: 'Fixed Income', desc: 'Watch the curve react to rate decisions' },
                ]}
            />
        </div>
    );
}

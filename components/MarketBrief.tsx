import { Sparkles } from 'lucide-react';
import { getMarketBrief } from '@/lib/actions/deepseek.actions';

/**
 * AI-written daily market brief for the homepage. Streamed via <Suspense>, so it
 * never blocks the page; renders nothing when unavailable (no key / no news).
 */
export default async function MarketBrief() {
    const brief = await getMarketBrief();
    if (!brief) return null;

    return (
        <section className="w-full rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-gray-100">AI Market Brief</h2>
                <span className="text-xs text-gray-500">DeepSeek · from today’s headlines</span>
            </div>
            <ul className="flex flex-col gap-2">
                {brief.points.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/70" />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-[11px] text-gray-600">
                AI-generated from news headlines — informational only, not investment advice.
            </p>
        </section>
    );
}

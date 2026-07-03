import { Sparkles } from 'lucide-react';
import { getCompanyBrief } from '@/lib/actions/ai.actions';

/** AI company summary (streamed via Suspense; renders nothing when unavailable). */
export default async function CompanyBrief({ symbol, name }: { symbol: string; name: string }) {
    const brief = await getCompanyBrief(symbol, name);
    if (!brief) return null;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-gray-100">Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{brief.text}</p>
            <p className="mt-3 text-[11px] text-gray-600">
                FeedCast AI · generated from public info &amp; headlines — not investment advice.
            </p>
        </div>
    );
}

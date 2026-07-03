import { LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPerformanceNote } from '@/lib/actions/stock-ai.actions';

/**
 * AI explanation of the stock's year-to-date move (cached per session).
 * Streamed via Suspense; renders nothing when the engine is unavailable.
 */
export default async function PerformanceNote({ symbol, name }: { symbol: string; name: string }) {
    const note = await getPerformanceNote(symbol, name);
    if (!note) return null;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-2 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-gray-100">This year so far</h3>
                {note.ytd != null && (
                    <span
                        className={cn(
                            'rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                            note.ytd >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        )}
                    >
                        {note.ytd > 0 ? '+' : ''}{note.ytd.toFixed(1)}% YTD
                    </span>
                )}
                <span className="ml-auto text-xs text-gray-500">AI</span>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-gray-300">
                {note.text.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </div>
            <p className="mt-3 text-[11px] text-gray-600">
                FeedCast AI · generated from market data &amp; headlines — not investment advice.
            </p>
        </div>
    );
}

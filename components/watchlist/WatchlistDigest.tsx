import { Sparkles } from 'lucide-react';
import { getWatchlistDigest } from '@/lib/actions/deepseek.actions';

/** AI digest of news across the user's watchlist (streamed; omitted when empty). */
export default async function WatchlistDigest({ symbols }: { symbols: string[] }) {
    if (!symbols.length) return null;
    const digest = await getWatchlistDigest(symbols);
    if (!digest) return null;

    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-gray-100">AI Watchlist Digest</h2>
                <span className="text-xs text-gray-500">DeepSeek · from your stocks’ headlines</span>
            </div>
            <ul className="flex flex-col gap-2">
                {digest.points.map((point, i) => (
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

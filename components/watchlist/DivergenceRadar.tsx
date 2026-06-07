import Link from 'next/link';
import { Radar, TrendingUp, TrendingDown } from 'lucide-react';
import { getSentimentDivergence } from '@/lib/actions/divergence.actions';

/**
 * Sentiment / price divergence radar — flags watchlist names where social
 * sentiment and recent price disagree. Omitted entirely when Adanos is off.
 */
export default async function DivergenceRadar({ symbols }: { symbols: string[] }) {
    if (!symbols.length) return null;
    const items = await getSentimentDivergence(symbols);
    if (!items) return null; // Adanos unavailable

    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-100">
                <Radar className="h-4 w-4 text-teal-400" /> Sentiment / Price Divergence
            </h2>
            <p className="mb-3 text-xs text-gray-500">
                Where social sentiment and the last week of price disagree — a potential
                turning-point tell.
            </p>

            {items.length ? (
                <ul className="flex flex-col divide-y divide-gray-800/70">
                    {items.map((it) => {
                        const bullish = it.kind === 'bullish';
                        return (
                            <li key={it.symbol} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                            bullish ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                                        }`}
                                    >
                                        {bullish ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {bullish ? 'Bullish' : 'Bearish'}
                                    </span>
                                    <Link href={`/stocks/${it.symbol}`} className="font-semibold text-gray-100 hover:text-teal-400">
                                        {it.symbol}
                                    </Link>
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                    <span className={it.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {it.priceChange >= 0 ? '+' : ''}
                                        {it.priceChange.toFixed(1)}% 1W
                                    </span>
                                    {it.bullishPct != null && (
                                        <span className="ml-2">· {Math.round(it.bullishPct)}% bullish</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="py-2 text-sm text-gray-500">No notable divergences across your watchlist right now.</p>
            )}
        </section>
    );
}

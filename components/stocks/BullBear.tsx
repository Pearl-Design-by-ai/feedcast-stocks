'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, Scale } from 'lucide-react';
import { getBullBear, type BullBear as BullBearData } from '@/lib/actions/ai.actions';

/** On-demand AI bull vs bear case for a ticker (avoids cost on every page view). */
export default function BullBear({ symbol, name }: { symbol: string; name: string }) {
    const [data, setData] = useState<BullBearData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function generate() {
        setLoading(true);
        setError('');
        try {
            const res = await getBullBear(symbol, name);
            if (res) setData(res);
            else setError('Couldn’t generate this right now.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                    <Scale className="h-4 w-4 text-teal-400" /> Bull vs Bear
                </h3>
                {!data && (
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/20 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {loading ? 'Thinking…' : 'Generate'}
                    </button>
                )}
            </div>

            {error && <p className="text-sm text-yellow-200/80">{error}</p>}

            {data ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-400">
                            <TrendingUp className="h-3.5 w-3.5" /> Bull case
                        </p>
                        <ul className="flex flex-col gap-1.5">
                            {data.bull.map((p, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500/70" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
                            <TrendingDown className="h-3.5 w-3.5" /> Bear case
                        </p>
                        <ul className="flex flex-col gap-1.5">
                            {data.bear.map((p, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/70" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                !error && (
                    <p className="text-sm text-gray-500">
                        Generate an AI-balanced view — the strongest bull and bear points for {symbol.toUpperCase()}.
                    </p>
                )
            )}

            {data && (
                <p className="mt-3 text-[11px] text-gray-600">FeedCast AI · balanced by design — not investment advice.</p>
            )}
        </div>
    );
}

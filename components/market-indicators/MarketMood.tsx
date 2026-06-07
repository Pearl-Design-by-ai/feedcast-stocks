import { ExternalLink } from 'lucide-react';
import type { CryptoFearGreed } from '@/lib/actions/market-mood.actions';

// Map a 0–100 reading to the fear→greed colour ramp.
function moodColor(v: number): string {
    if (v < 25) return '#FF495B'; // extreme fear
    if (v < 45) return '#FF8243'; // fear
    if (v < 55) return '#FDD458'; // neutral
    if (v < 75) return '#0FEDBE'; // greed
    return '#22c55e'; // extreme greed
}

/**
 * "Market Mood" strip at the top of the Market Indicators page: a live Crypto
 * Fear & Greed gauge plus a link to CNN's equity Fear & Greed index.
 */
export default function MarketMood({ fng }: { fng: CryptoFearGreed | null }) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Crypto Fear & Greed — live gauge */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-100">Crypto Fear &amp; Greed</h3>
                    <span className="text-xs text-gray-500">alternative.me</span>
                </div>

                {fng ? (
                    <>
                        <div className="flex items-end gap-3">
                            <span
                                className="text-4xl font-bold leading-none"
                                style={{ color: moodColor(fng.value) }}
                            >
                                {fng.value}
                            </span>
                            <span className="mb-0.5 text-sm text-gray-400">
                                {fng.classification}
                            </span>
                        </div>
                        <div
                            className="relative mt-4 h-2 w-full rounded-full"
                            style={{
                                background:
                                    'linear-gradient(90deg,#FF495B,#FF8243,#FDD458,#0FEDBE,#22c55e)',
                            }}
                        >
                            <span
                                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-950 bg-white shadow"
                                style={{ left: `${Math.min(100, Math.max(0, fng.value))}%` }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-gray-500">
                            <span>Extreme Fear</span>
                            <span>Extreme Greed</span>
                        </div>
                    </>
                ) : (
                    <p className="py-4 text-sm text-gray-500">
                        Live reading unavailable right now — please check back shortly.
                    </p>
                )}
            </div>

            {/* CNN Fear & Greed — link out */}
            <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-100">CNN Fear &amp; Greed</h3>
                    <span className="text-xs text-gray-500">CNN</span>
                </div>
                <p className="mb-4 flex-1 text-sm text-gray-400">
                    The classic 7-factor US-equity mood gauge, from 0 (extreme fear) to 100
                    (extreme greed). No live embed — open it at the source.
                </p>
                <a
                    href="https://www.cnn.com/markets/fear-and-greed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-gray-800"
                >
                    Open at CNN
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </section>
    );
}

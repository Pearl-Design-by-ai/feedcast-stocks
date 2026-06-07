import type { CryptoFearGreed } from '@/lib/actions/market-mood.actions';

function moodColor(v: number): string {
    if (v < 25) return '#FF495B';
    if (v < 45) return '#FF8243';
    if (v < 55) return '#FDD458';
    if (v < 75) return '#0FEDBE';
    return '#22c55e';
}

/** Compact live Crypto Fear & Greed gauge (alternative.me). */
export default function CryptoFearGreedGauge({ fng }: { fng: CryptoFearGreed | null }) {
    return (
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
                        <span className="mb-0.5 text-sm text-gray-400">{fng.classification}</span>
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
                <p className="py-4 text-sm text-gray-500">Live reading unavailable right now.</p>
            )}
        </div>
    );
}

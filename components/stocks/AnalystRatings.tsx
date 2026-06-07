import type { RecommendationTrend } from '@/lib/actions/stock-insights.actions';

const SEGMENTS: Array<{ key: keyof RecommendationTrend; label: string; color: string }> = [
    { key: 'strongBuy', label: 'Strong Buy', color: '#16a34a' },
    { key: 'buy', label: 'Buy', color: '#22c55e' },
    { key: 'hold', label: 'Hold', color: '#9095A1' },
    { key: 'sell', label: 'Sell', color: '#FF8243' },
    { key: 'strongSell', label: 'Strong Sell', color: '#FF495B' },
];

function verdict(score: number): { label: string; color: string } {
    if (score > 1) return { label: 'Strong Buy', color: '#16a34a' };
    if (score > 0.3) return { label: 'Buy', color: '#22c55e' };
    if (score > -0.3) return { label: 'Hold', color: '#FDD458' };
    if (score > -1) return { label: 'Sell', color: '#FF8243' };
    return { label: 'Strong Sell', color: '#FF495B' };
}

/** Analyst recommendation breakdown for the latest reported month. */
export default function AnalystRatings({ trends }: { trends: RecommendationTrend[] }) {
    const t = trends[0];
    if (!t) return null;
    const total = t.strongBuy + t.buy + t.hold + t.sell + t.strongSell;
    if (!total) return null;

    const score = (t.strongBuy * 2 + t.buy - t.sell - t.strongSell * 2) / total;
    const v = verdict(score);

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-100">Analyst Ratings</h3>
                <span className="text-sm font-semibold" style={{ color: v.color }}>
                    {v.label}
                </span>
            </div>

            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
                {SEGMENTS.map((s) => {
                    const n = t[s.key] as number;
                    if (!n) return null;
                    return (
                        <div
                            key={s.key}
                            style={{ width: `${(n / total) * 100}%`, backgroundColor: s.color }}
                            title={`${s.label}: ${n}`}
                        />
                    );
                })}
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {SEGMENTS.map((s) => (
                    <div key={s.key} className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-100">
                            {t[s.key] as number}
                        </span>
                        <span className="text-[10px] leading-tight text-gray-500">{s.label}</span>
                    </div>
                ))}
            </div>

            <p className="mt-3 text-[11px] text-gray-600">
                {total} analysts · {t.period}
            </p>
        </div>
    );
}

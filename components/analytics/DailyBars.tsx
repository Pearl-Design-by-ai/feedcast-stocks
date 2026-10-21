import type { DayPoint } from '@/lib/analytics/stats';

/** Daily page views (bars) with unique visitors (inner bars), plain SVG. */
export default function DailyBars({ data }: { data: DayPoint[] }) {
    const W = 720;
    const H = 180;
    const PAD = 20;
    const max = Math.max(1, ...data.map((d) => d.views));
    const slot = (W - PAD * 2) / Math.max(1, data.length);
    const bar = Math.max(2, slot * 0.7);
    const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
    const labelEvery = data.length > 14 ? 5 : 1;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily page views and unique visitors">
            <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className="stroke-gray-700" />
            <text x={PAD} y={PAD - 6} className="fill-gray-500 text-[10px] tabular-nums">
                {max}
            </text>
            {data.map((d, i) => {
                const x = PAD + i * slot + (slot - bar) / 2;
                return (
                    <g key={d.day}>
                        <title>{`${d.day}: ${d.views} views, ${d.uniques} unique`}</title>
                        <rect x={x} y={y(d.views)} width={bar} height={H - PAD - y(d.views)} rx={2} className="fill-teal-500/40" />
                        <rect
                            x={x + bar * 0.25}
                            y={y(d.uniques)}
                            width={bar * 0.5}
                            height={H - PAD - y(d.uniques)}
                            rx={1}
                            className="fill-teal-300"
                        />
                        {i % labelEvery === 0 && (
                            <text x={x + bar / 2} y={H - 6} textAnchor="middle" className="fill-gray-500 text-[9px] tabular-nums">
                                {d.day.slice(5)}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

/**
 * Dependency-free charts for /my-portfolio. Bars are plain flex divs (crisp
 * text at any width); lines are an SVG stretched to the box with
 * non-scaling strokes, with HTML axis labels around it. All colors come from
 * Tailwind tokens so they follow the light/dark theme.
 */

import { cn } from '@/lib/utils';
import { fmtShare, fmtUsdShort } from '@/lib/private-portfolio/format';
import { integerTicks, type Slice, type XY } from '@/lib/private-portfolio/math';

export const SERIES_BG = ['bg-teal-400', 'bg-sky-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-emerald-400', 'bg-fuchsia-400', 'bg-lime-400'];
const SERIES_STROKE = ['stroke-teal-400', 'stroke-sky-400', 'stroke-violet-400', 'stroke-amber-400', 'stroke-rose-400', 'stroke-emerald-400', 'stroke-fuchsia-400', 'stroke-lime-400'];

export function Legend({ items }: { items: { label: string; className: string }[] }) {
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            {items.map((it) => (
                <li key={it.label} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', it.className)} />
                    {it.label}
                </li>
            ))}
        </ul>
    );
}

/** One stacked 100% bar plus a legend table with value and share. */
export function AllocationBar({ slices }: { slices: Slice[] }) {
    const shown = slices.filter((s) => s.share > 0);
    if (!shown.length) return <p className="text-sm text-gray-500">Dağılım verisi yok.</p>;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-800" role="img" aria-label="Varlık dağılımı">
                {shown.map((s, i) => (
                    <div key={s.key} className={SERIES_BG[i % SERIES_BG.length]} style={{ width: `${s.share * 100}%` }} title={`${s.key} ${fmtShare(s.share)}`} />
                ))}
            </div>
            <ul className="grid grid-cols-1 gap-y-1.5">
                {shown.map((s, i) => (
                    <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-gray-300">
                            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', SERIES_BG[i % SERIES_BG.length])} />
                            <span className="truncate">{s.key}</span>
                        </span>
                        <span className="shrink-0 text-gray-400 tabular-nums">
                            {fmtUsdShort(s.valueUsd)} · <span className="text-gray-200">{fmtShare(s.share)}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Grouped vertical bars, e.g. 12 months × (current, plan). */
export function GroupedBars({
    labels,
    series,
    height = 200,
}: {
    labels: string[];
    series: { name: string; values: number[] }[];
    height?: number;
}) {
    const max = Math.max(1, ...series.flatMap((s) => s.values));
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-stretch gap-2">
                <div className="flex w-12 shrink-0 flex-col justify-between text-right text-[10px] text-gray-500 tabular-nums" style={{ height }}>
                    <span>{fmtUsdShort(max)}</span>
                    <span>{fmtUsdShort(max / 2)}</span>
                    <span>$0</span>
                </div>
                <div className="relative flex min-w-0 flex-1 items-end gap-1 border-b border-l border-gray-700 sm:gap-2" style={{ height }}>
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-800" />
                    {labels.map((label, i) => (
                        <div key={label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px sm:gap-0.5">
                            {series.map((s, j) => {
                                const v = s.values[i] ?? 0;
                                return (
                                    <div
                                        key={s.name}
                                        className={cn('w-full max-w-4 rounded-t-sm', SERIES_BG[j % SERIES_BG.length])}
                                        style={{ height: `${(Math.max(0, v) / max) * 100}%` }}
                                        title={`${label} · ${s.name}: ${fmtUsdShort(v)}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                <div className="w-12 shrink-0" />
                <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">
                    {labels.map((l) => (
                        <span key={l} className="min-w-0 flex-1 truncate text-center text-[10px] text-gray-500" title={l}>
                            <span className="sm:hidden">{l.slice(0, 1)}</span>
                            <span className="hidden sm:inline">{l}</span>
                        </span>
                    ))}
                </div>
            </div>
            <Legend items={series.map((s, j) => ({ label: s.name, className: SERIES_BG[j % SERIES_BG.length] }))} />
        </div>
    );
}

/**
 * Multi-series line chart over a numeric x axis (years, or fractional years
 * for monthly data — see monthToYear). Points are sorted numerically and
 * placed proportionally, so uneven or mixed ranges never reorder. Series may
 * cover different x ranges. When every y is ≥ 0 the axis starts at 0 (≤ 0:
 * ends at 0); a series whose last point is 0 gets an end dot — depletion.
 */
export function LineChart({
    series,
    format = fmtUsdShort,
    formatX = (x: number) => String(Math.round(x)),
    height = 220,
    zeroLine = false,
}: {
    series: { name: string; points: XY[] }[];
    format?: (n: number) => string;
    formatX?: (x: number) => string;
    height?: number;
    zeroLine?: boolean;
}) {
    const lines = series.map((s) => ({ ...s, points: s.points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x) }));
    const xsAll = lines.flatMap((s) => s.points.map((p) => p.x));
    const ys = lines.flatMap((s) => s.points.map((p) => p.y));
    const xmin = Math.min(...xsAll);
    const xmax = Math.max(...xsAll);
    if (new Set(xsAll).size < 2 || !ys.length) return <p className="text-sm text-gray-500">Grafik için yeterli veri yok.</p>;
    let min = Math.min(...ys);
    let max = Math.max(...ys);
    if (zeroLine || min >= 0) min = Math.min(min, 0);
    if (zeroLine || max <= 0) max = Math.max(max, 0);
    if (max === min) max = min + 1;
    const px = (x: number) => ((x - xmin) / (xmax - xmin)) * 100;
    const py = (y: number) => 100 - ((y - min) / (max - min)) * 100;
    const ticks = integerTicks(xmin, xmax);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-stretch gap-2">
                <div className="flex w-12 shrink-0 flex-col justify-between text-right text-[10px] text-gray-500 tabular-nums" style={{ height }}>
                    <span>{format(max)}</span>
                    <span>{format((max + min) / 2)}</span>
                    <span>{format(min)}</span>
                </div>
                <div className="relative min-w-0 flex-1 border-b border-l border-gray-700" style={{ height }}>
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-800" />
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label={lines.map((s) => s.name).join(', ')}>
                        {min < 0 && max > 0 && (
                            <line x1="0" x2="100" y1={py(0)} y2={py(0)} className="stroke-gray-600" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                        )}
                        {lines.map((s, j) => (
                            <polyline
                                key={s.name}
                                fill="none"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                className={SERIES_STROKE[j % SERIES_STROKE.length]}
                                points={s.points.map((p) => `${px(p.x).toFixed(2)},${py(p.y).toFixed(2)}`).join(' ')}
                            />
                        ))}
                    </svg>
                    {/* End dots as HTML so they stay round on the stretched SVG. */}
                    {lines.map((s, j) => {
                        const last = s.points[s.points.length - 1];
                        if (!last || last.y !== 0 || s.points.length < 2 || min < 0) return null;
                        return (
                            <span
                                key={s.name}
                                className={cn('absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-gray-900', SERIES_BG[j % SERIES_BG.length])}
                                style={{ left: `${px(last.x)}%`, bottom: 0 }}
                                title={`${s.name}: tükenme ${formatX(last.x)}`}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="flex gap-2">
                <div className="w-12 shrink-0" />
                <div className="relative h-3 min-w-0 flex-1 text-[10px] text-gray-500 tabular-nums">
                    {ticks.map((t, i) => (
                        <span
                            key={t}
                            className={cn(
                                'absolute top-0 whitespace-nowrap',
                                i === 0 && px(t) < 4 ? '' : i === ticks.length - 1 && px(t) > 96 ? '-translate-x-full' : '-translate-x-1/2',
                                // Every other inner tick only from sm up, so narrow screens don't crowd.
                                i % 2 === 1 && i !== ticks.length - 1 && 'hidden sm:inline'
                            )}
                            style={{ left: `${px(t)}%` }}
                        >
                            {formatX(t)}
                        </span>
                    ))}
                </div>
            </div>
            <Legend items={lines.map((s, j) => ({ label: s.name, className: SERIES_BG[j % SERIES_BG.length] }))} />
        </div>
    );
}

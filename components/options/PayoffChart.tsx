'use client';

/**
 * Payoff diagram — a responsive SVG of profit/loss at expiration vs. the
 * underlying price. Shades the profit zone green and the loss zone red, marks
 * the current price and break-evens, and draws the zero line. Pure presentation;
 * the curve + levels come from lib/options/payoff.ts.
 */

import { useId } from 'react';

export default function PayoffChart({
    curve,
    breakevens,
    spot,
    height = 260,
}: {
    curve: [number, number][];
    breakevens: number[];
    spot: number;
    height?: number;
}) {
    const clip = useId().replace(/:/g, '');
    if (curve.length < 2) return null;

    const W = 640;
    const H = height;
    const padL = 8;
    const padR = 8;
    const padT = 14;
    const padB = 22;

    const xs = curve.map((c) => c[0]);
    const ys = curve.map((c) => c[1]);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    let yMin = Math.min(...ys, 0);
    let yMax = Math.max(...ys, 0);
    const yPad = (yMax - yMin) * 0.08 || 1;
    yMin -= yPad;
    yMax += yPad;

    const px = (x: number) => padL + ((x - xMin) / (xMax - xMin || 1)) * (W - padL - padR);
    const py = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin || 1)) * (H - padT - padB);

    const zeroY = py(0);
    const line = curve.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ');
    // Area between the curve and the zero baseline (clipped above/below for color).
    const area = `${line} L${px(xMax).toFixed(1)},${zeroY.toFixed(1)} L${px(xMin).toFixed(1)},${zeroY.toFixed(1)} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Options payoff diagram" preserveAspectRatio="none" style={{ height }}>
            <defs>
                <clipPath id={`above-${clip}`}>
                    <rect x="0" y="0" width={W} height={zeroY} />
                </clipPath>
                <clipPath id={`below-${clip}`}>
                    <rect x="0" y={zeroY} width={W} height={H - zeroY} />
                </clipPath>
            </defs>

            {/* Profit / loss shading */}
            <path d={area} fill="#10b981" opacity={0.16} clipPath={`url(#above-${clip})`} />
            <path d={area} fill="#ef4444" opacity={0.16} clipPath={`url(#below-${clip})`} />

            {/* Zero line */}
            <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 4" />

            {/* P/L curve, colored by side */}
            <path d={line} fill="none" stroke="#10b981" strokeWidth={2} clipPath={`url(#above-${clip})`} />
            <path d={line} fill="none" stroke="#ef4444" strokeWidth={2} clipPath={`url(#below-${clip})`} />

            {/* Current price marker */}
            {spot >= xMin && spot <= xMax && (
                <>
                    <line x1={px(spot)} y1={padT} x2={px(spot)} y2={H - padB} stroke="#2dd4bf" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
                    <text x={px(spot)} y={H - 6} fontSize={10} fill="#2dd4bf" textAnchor="middle">
                        {spot.toFixed(0)}
                    </text>
                </>
            )}

            {/* Break-even markers */}
            {breakevens.map((b) =>
                b >= xMin && b <= xMax ? (
                    <g key={b}>
                        <circle cx={px(b)} cy={zeroY} r={3.5} fill="#e5e7eb" stroke="#111827" strokeWidth={1} />
                        <text x={px(b)} y={zeroY - 7} fontSize={9} fill="#9ca3af" textAnchor="middle">
                            {b.toFixed(0)}
                        </text>
                    </g>
                ) : null
            )}
        </svg>
    );
}

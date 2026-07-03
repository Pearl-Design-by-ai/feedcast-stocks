/**
 * EtfArt — original, hand-built SVG illustrations for the ETF Hub category
 * cards, in the same vector grammar as LearnArt: pure shapes, no images, drawn
 * with currentColor so each scene inherits its category accent. Decorative.
 */

import { cn } from '@/lib/utils';

const VB = '0 0 320 180';

const SCENES: Record<string, React.ReactNode> = {
    // Candlestick skyline under a rising index line — the core market.
    'us-equity': (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.2" />
            {[
                { x: 48, t: 92, b: 136, up: true },
                { x: 90, t: 80, b: 122, up: true },
                { x: 132, t: 96, b: 140, up: false },
                { x: 174, t: 66, b: 108, up: true },
                { x: 216, t: 78, b: 126, up: false },
                { x: 258, t: 52, b: 96, up: true },
            ].map((c) => (
                <g key={c.x} stroke="currentColor" strokeWidth="2.5">
                    <line x1={c.x} y1={c.t - 10} x2={c.x} y2={c.b + 10} strokeOpacity="0.55" />
                    <rect x={c.x - 8} y={c.t} width="16" height={c.b - c.t} fill="currentColor" fillOpacity={c.up ? 0.55 : 0.16} />
                </g>
            ))}
            <path d="M28 120 C100 108, 180 84, 296 40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M296 40 l-15 -1 M296 40 l-4 14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </>
    ),
    // A segmented sector wheel with one slice pulled out — rotation.
    sector: (
        <>
            {[
                [0, 0.62], [33, 0.2], [66, 0.44], [99, 0.3], [132, 0.55],
                [165, 0.25], [198, 0.4], [231, 0.6], [264, 0.32], [297, 0.48], [330, 0.22],
            ].map(([a, o]) => {
                const start = ((a as number) * Math.PI) / 180;
                const end = (((a as number) + 27) * Math.PI) / 180;
                const cx = 160, cy = 92, r1 = 34, r2 = 62;
                const p = [
                    `M${cx + r1 * Math.cos(start)} ${cy + r1 * Math.sin(start)}`,
                    `L${cx + r2 * Math.cos(start)} ${cy + r2 * Math.sin(start)}`,
                    `A${r2} ${r2} 0 0 1 ${cx + r2 * Math.cos(end)} ${cy + r2 * Math.sin(end)}`,
                    `L${cx + r1 * Math.cos(end)} ${cy + r1 * Math.sin(end)}`,
                    `A${r1} ${r1} 0 0 0 ${cx + r1 * Math.cos(start)} ${cy + r1 * Math.sin(start)}`,
                    'Z',
                ].join(' ');
                return <path key={a} d={p} fill="currentColor" fillOpacity={o as number} />;
            })}
            <circle cx="160" cy="92" r="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeOpacity="0.5" />
            <rect x="238" y="28" width="34" height="24" rx="4" fill="currentColor" fillOpacity="0.65" transform="rotate(8 255 40)" />
        </>
    ),
    // Globe with meridians and market dots lighting up across regions.
    international: (
        <>
            <circle cx="160" cy="92" r="58" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.7" />
            <ellipse cx="160" cy="92" rx="24" ry="58" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.35" />
            <ellipse cx="160" cy="92" rx="46" ry="58" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.2" />
            <line x1="102" y1="92" x2="218" y2="92" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" />
            <path d="M108 64 h104 M108 120 h104" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <circle cx="136" cy="72" r="5" fill="currentColor" fillOpacity="0.9" />
            <circle cx="186" cy="60" r="4" fill="currentColor" fillOpacity="0.6" />
            <circle cx="176" cy="112" r="5" fill="currentColor" fillOpacity="0.75" />
            <circle cx="132" cy="118" r="3.5" fill="currentColor" fillOpacity="0.5" />
            <circle cx="252" cy="52" r="3" fill="currentColor" fillOpacity="0.5" />
            <circle cx="70" cy="128" r="3" fill="currentColor" fillOpacity="0.5" />
        </>
    ),
    // A coupon ladder stepping down the curve toward a % sign.
    bond: (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.2" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={36 + i * 50} y={58 + i * 20} width="38" height={94 - i * 20} rx="3" fill="currentColor" fillOpacity={0.5 - i * 0.08} />
            ))}
            <path d="M46 46 C120 60, 210 96, 292 128" stroke="currentColor" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" fill="none" />
            <circle cx="278" cy="52" r="17" stroke="currentColor" strokeWidth="3" fill="none" />
            <text x="278" y="58" fontSize="17" fontWeight="700" fill="currentColor" textAnchor="middle">%</text>
        </>
    ),
    // Coin stacks with a payout drip arcing back in — income compounding.
    dividend: (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.2" />
            {[0, 1, 2].map((s) =>
                [0, 1, 2, 3].slice(0, 4 - s).map((i) => (
                    <ellipse key={`${s}-${i}`} cx={92 + s * 62} cy={140 - i * 17} rx="27" ry="9" fill="currentColor" fillOpacity={0.55 - i * 0.09} stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                ))
            )}
            <path d="M92 62 C140 22, 220 22, 262 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" fill="none" />
            <path d="M262 70 l-13 -7 M262 70 l1 -15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <text x="92" y="52" fontSize="18" fontWeight="700" fill="currentColor" textAnchor="middle">$</text>
        </>
    ),
    // Factor mixer — equalizer sliders set to a deliberate tilt.
    factor: (
        <>
            {[
                { x: 70, y: 58 }, { x: 115, y: 96 }, { x: 160, y: 44 }, { x: 205, y: 112 }, { x: 250, y: 74 },
            ].map((s) => (
                <g key={s.x}>
                    <line x1={s.x} y1="32" x2={s.x} y2="152" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" />
                    <line x1={s.x} y1={s.y} x2={s.x} y2="152" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" />
                    <rect x={s.x - 11} y={s.y - 8} width="22" height="16" rx="4" fill="currentColor" fillOpacity="0.85" />
                </g>
            ))}
        </>
    ),
    // Circuit constellation — nodes and traces reaching up and to the right.
    thematic: (
        <>
            <g stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.55" strokeLinecap="round">
                <path d="M56 140 L116 108 L112 62" fill="none" />
                <path d="M116 108 L180 96 L232 48" fill="none" />
                <path d="M180 96 L196 138 L258 122" fill="none" />
                <path d="M112 62 L168 34" fill="none" />
            </g>
            <circle cx="56" cy="140" r="7" fill="currentColor" fillOpacity="0.5" />
            <circle cx="116" cy="108" r="9" fill="currentColor" fillOpacity="0.85" />
            <circle cx="112" cy="62" r="6" fill="currentColor" fillOpacity="0.55" />
            <circle cx="180" cy="96" r="8" fill="currentColor" fillOpacity="0.7" />
            <circle cx="232" cy="48" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="232" cy="48" r="3.5" fill="currentColor" />
            <circle cx="196" cy="138" r="5" fill="currentColor" fillOpacity="0.45" />
            <circle cx="258" cy="122" r="6" fill="currentColor" fillOpacity="0.6" />
            <circle cx="168" cy="34" r="5" fill="currentColor" fillOpacity="0.9" />
        </>
    ),
    // Stacked ingots with a rising droplet — bullion and barrels.
    commodity: (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.2" />
            {[
                { x: 60, y: 128 }, { x: 118, y: 128 }, { x: 89, y: 102 },
            ].map((b, i) => (
                <path key={i} d={`M${b.x} ${b.y} h52 l-8 22 h-36 z`} fill="currentColor" fillOpacity={0.6 - i * 0.12} stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
            ))}
            <path d="M232 62 C218 84, 212 96, 212 110 a20 20 0 0 0 40 0 c0 -14 -6 -26 -20 -48 z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="2.5" />
            <path d="M60 66 C120 52, 190 44, 268 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" fill="none" />
        </>
    ),
    // A skyline over a pipeline — property and the pipes beneath it.
    'real-assets': (
        <>
            <line x1="20" y1="140" x2="300" y2="140" stroke="currentColor" strokeWidth="3" strokeOpacity="0.5" />
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            {[
                { x: 56, w: 34, h: 74 }, { x: 100, w: 28, h: 96 }, { x: 138, w: 40, h: 58 },
                { x: 188, w: 30, h: 84 }, { x: 228, w: 36, h: 66 },
            ].map((b) => (
                <g key={b.x}>
                    <rect x={b.x} y={140 - b.h} width={b.w} height={b.h} fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" />
                    {[0, 1, 2].map((r) => (
                        <rect key={r} x={b.x + 6} y={148 - b.h + r * 18} width={b.w - 12} height="7" fill="currentColor" fillOpacity="0.4" />
                    ))}
                </g>
            ))}
        </>
    ),
    // Interlocking hex chain — blocks linking left to right.
    crypto: (
        <>
            {[
                { x: 84, y: 92, r: 30, o: 0.7 }, { x: 160, y: 68, r: 24, o: 0.45 }, { x: 228, y: 100, r: 34, o: 0.9 },
            ].map((h) => {
                const pts = [0, 60, 120, 180, 240, 300]
                    .map((a) => {
                        const rad = ((a - 90) * Math.PI) / 180;
                        return `${h.x + h.r * Math.cos(rad)},${h.y + h.r * Math.sin(rad)}`;
                    })
                    .join(' ');
                return <polygon key={h.x} points={pts} stroke="currentColor" strokeWidth="3" strokeOpacity={h.o} fill="currentColor" fillOpacity={h.o * 0.14} />;
            })}
            <line x1="110" y1="84" x2="140" y2="74" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.5" />
            <line x1="182" y1="76" x2="200" y2="88" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.5" />
            <text x="228" y="107" fontSize="20" fontWeight="700" fill="currentColor" textAnchor="middle">₿</text>
        </>
    ),
    // Mirrored 3x arrows — amplified both ways, with the multiplier badge.
    leveraged: (
        <>
            <line x1="20" y1="92" x2="300" y2="92" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="4 6" />
            <path d="M48 128 L128 92 L208 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M208 30 l-17 2 M208 30 l-3 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M48 56 L128 92 L208 154" stroke="currentColor" strokeWidth="4" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M208 154 l-17 -2 M208 154 l-3 -17" stroke="currentColor" strokeWidth="4" strokeOpacity="0.35" strokeLinecap="round" />
            <circle cx="258" cy="66" r="22" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" />
            <text x="258" y="73" fontSize="18" fontWeight="700" fill="currentColor" textAnchor="middle">3×</text>
        </>
    ),
};

export default function EtfArt({ category, className }: { category: string; className?: string }) {
    const scene = SCENES[category] ?? SCENES['us-equity'];
    return (
        <svg
            viewBox={VB}
            preserveAspectRatio="xMidYMid meet"
            className={cn('h-full w-full', className)}
            fill="none"
            aria-hidden
        >
            {scene}
        </svg>
    );
}

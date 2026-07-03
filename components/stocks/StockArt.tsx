/**
 * StockArt — original, hand-built SVG illustrations for the Stock Hub category
 * cards, in the shared LearnArt/EtfArt vector grammar: pure shapes, no images,
 * drawn with currentColor so each scene inherits its category accent.
 */

import { cn } from '@/lib/utils';

const VB = '0 0 320 180';

const SCENES: Record<string, React.ReactNode> = {
    // A podium of towers — the biggest blocks in the market.
    'mega-caps': (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.25" />
            {[
                { x: 62, h: 66, o: 0.35 }, { x: 106, h: 92, o: 0.5 }, { x: 150, h: 122, o: 0.8 },
                { x: 194, h: 84, o: 0.45 }, { x: 238, h: 58, o: 0.3 },
            ].map((b) => (
                <rect key={b.x} x={b.x - 17} y={152 - b.h} width="34" height={b.h} rx="4" fill="currentColor" fillOpacity={b.o} />
            ))}
            <circle cx="150" cy="16" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M150 23 v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
    ),
    // Coins dripping from a branch — the payout tree.
    dividend: (
        <>
            <path d="M60 152 C80 110, 120 76, 190 58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M120 96 C150 88, 176 88, 204 96 M92 122 C120 112, 148 110, 172 116" stroke="currentColor" strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round" fill="none" />
            {[
                { x: 208, y: 70 }, { x: 232, y: 96 }, { x: 196, y: 118 }, { x: 246, y: 132 },
            ].map((c) => (
                <g key={`${c.x}-${c.y}`}>
                    <circle cx={c.x} cy={c.y} r="12" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="2" />
                    <text x={c.x} y={c.y + 4} fontSize="11" fontWeight="700" fill="currentColor" textAnchor="middle">$</text>
                </g>
            ))}
        </>
    ),
    // A steep compounding curve leaving a shallow one behind.
    growth: (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.2" />
            <path d="M32 144 C120 138, 210 126, 292 108" stroke="currentColor" strokeWidth="3" strokeOpacity="0.35" strokeDasharray="6 6" strokeLinecap="round" fill="none" />
            <path d="M32 144 C130 138, 210 100, 268 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M268 30 l-16 3 M268 30 l-1 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="144" r="4.5" fill="currentColor" />
        </>
    ),
    // A price tag under intrinsic value — the value gap.
    value: (
        <>
            <path d="M96 58 h74 l36 36 -74 74 -36 -36 z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.14" strokeLinejoin="round" transform="rotate(-8 160 110)" />
            <circle cx="162" cy="78" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" transform="rotate(-8 160 110)" />
            <text x="140" y="128" fontSize="22" fontWeight="700" fill="currentColor" textAnchor="middle" transform="rotate(-8 140 122)">$</text>
            <line x1="222" y1="52" x2="286" y2="52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="234" y1="76" x2="274" y2="76" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M254 96 v34 M254 96 l-9 12 M254 96 l9 12" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    // Terminal window with a code cursor and sparkline.
    tech: (
        <>
            <rect x="58" y="38" width="204" height="112" rx="10" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.08" />
            <line x1="58" y1="62" x2="262" y2="62" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
            <circle cx="74" cy="50" r="3.5" fill="currentColor" fillOpacity="0.7" />
            <circle cx="88" cy="50" r="3.5" fill="currentColor" fillOpacity="0.45" />
            <circle cx="102" cy="50" r="3.5" fill="currentColor" fillOpacity="0.25" />
            <path d="M78 86 l16 12 -16 12 M104 112 h22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polyline points="150,124 172,110 190,118 212,92 238,80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="238" y="128" width="12" height="4" fill="currentColor" />
        </>
    ),
    // A chip die with radiating traces — the AI engine.
    'semis-ai': (
        <>
            <rect x="118" y="54" width="84" height="76" rx="8" stroke="currentColor" strokeWidth="3.5" fill="currentColor" fillOpacity="0.14" />
            <rect x="140" y="74" width="40" height="36" rx="4" fill="currentColor" fillOpacity="0.55" />
            {[66, 82, 98, 114].map((y) => (
                <g key={y} stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round">
                    <line x1="118" y1={y} x2="88" y2={y} />
                    <line x1="202" y1={y} x2="232" y2={y} />
                </g>
            ))}
            {[136, 154, 172, 190].map((x) => (
                <g key={x} stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round">
                    <line x1={x} y1="54" x2={x} y2="30" />
                    <line x1={x} y1="130" x2={x} y2="154" />
                </g>
            ))}
            <circle cx="88" cy="66" r="3" fill="currentColor" />
            <circle cx="232" cy="114" r="3" fill="currentColor" />
        </>
    ),
    // Pulse line into a cross — health and its heartbeat.
    healthcare: (
        <>
            <path d="M28 100 h56 l14 -34 20 62 16 -40 10 12 h40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <g transform="translate(232 64)">
                <path d="M14 0 h24 v14 h14 v24 h-14 v14 h-24 v-14 h-14 v-24 h14 z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            </g>
        </>
    ),
    // A bank pediment over columns — plus a card swiping through.
    financial: (
        <>
            <path d="M92 62 L164 30 L236 62 z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.18" strokeLinejoin="round" />
            {[110, 142, 174, 206].map((x) => (
                <rect key={x} x={x} y="70" width="14" height="56" rx="2" fill="currentColor" fillOpacity="0.4" />
            ))}
            <rect x="92" y="130" width="144" height="10" rx="3" fill="currentColor" fillOpacity="0.55" />
            <rect x="212" y="104" width="66" height="42" rx="6" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.2" transform="rotate(-10 245 125)" />
            <line x1="216" y1="118" x2="276" y2="107" stroke="currentColor" strokeWidth="5" strokeOpacity="0.5" />
        </>
    ),
    // Shopping bag with an upward tick — spend as a signal.
    consumer: (
        <>
            <path d="M104 74 h112 l-10 78 h-92 z" stroke="currentColor" strokeWidth="3.5" fill="currentColor" fillOpacity="0.14" strokeLinejoin="round" />
            <path d="M130 74 a30 30 0 0 1 60 0" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <polyline points="122,132 146,116 164,124 194,98" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M194 98 l-12 1 M194 98 l-2 12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </>
    ),
    // A gear meshing with a radar sweep — industry and defense.
    'industrial-defense': (
        <>
            <g transform="translate(112 92)">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                    <rect key={a} x={-6} y={-52} width="12" height="16" rx="2" fill="currentColor" fillOpacity="0.55" transform={`rotate(${a})`} />
                ))}
                <circle r="38" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.12" />
                <circle r="14" stroke="currentColor" strokeWidth="3.5" fill="none" />
            </g>
            <g transform="translate(236 92)">
                <circle r="40" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.5" fill="none" />
                <circle r="24" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" fill="none" strokeDasharray="3 6" />
                <path d="M0 0 L30 -26 A40 40 0 0 0 8 -39 z" fill="currentColor" fillOpacity="0.45" />
                <circle cx="14" cy="18" r="3.5" fill="currentColor" />
            </g>
        </>
    ),
    // Derrick beside a power pylon — barrels to grid.
    'energy-materials': (
        <>
            <line x1="20" y1="152" x2="300" y2="152" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M76 152 L104 44 L132 152 M86 116 h36 M92 84 h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="104" cy="44" r="5" fill="currentColor" fillOpacity="0.7" />
            <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.85">
                <path d="M210 152 L230 56 L250 152" />
                <path d="M196 84 h68 M204 112 h52" />
                <path d="M196 84 C204 96, 212 104, 220 108 M264 84 C256 96, 248 104, 240 108" strokeOpacity="0.45" strokeWidth="2" />
            </g>
            <path d="M288 60 l-10 20 h8 l-10 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
    ),
    // Route arcs hopping between exchange dots — capital crossing borders.
    'international-adrs': (
        <>
            <line x1="20" y1="126" x2="300" y2="126" stroke="currentColor" strokeOpacity="0.25" />
            {[56, 128, 200, 272].map((x, i) => (
                <circle key={x} cx={x} cy="126" r={i === 2 ? 8 : 6} fill="currentColor" fillOpacity={0.35 + i * 0.15} />
            ))}
            <path d="M56 126 C80 66, 104 66, 128 126" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
            <path d="M128 126 C152 46, 176 46, 200 126" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.75" />
            <path d="M200 126 C224 60, 248 60, 272 126" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M272 126 l-9 -10 M272 126 l-13 -2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
    ),
    // Keyed building rows — the listed landlords.
    reits: (
        <>
            <line x1="20" y1="148" x2="300" y2="148" stroke="currentColor" strokeWidth="3" strokeOpacity="0.4" />
            {[
                { x: 70, w: 44, h: 84 }, { x: 126, w: 36, h: 104 }, { x: 174, w: 48, h: 68 }, { x: 234, w: 32, h: 92 },
            ].map((b) => (
                <g key={b.x}>
                    <rect x={b.x} y={148 - b.h} width={b.w} height={b.h} stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.16" />
                    {[0, 1].map((c) =>
                        [0, 1, 2].map((r) => (
                            <rect key={`${c}-${r}`} x={b.x + 7 + c * ((b.w - 14) / 2 + 2)} y={156 - b.h + r * 22} width={(b.w - 18) / 2} height="9" fill="currentColor" fillOpacity="0.45" />
                        ))
                    )}
                </g>
            ))}
            <circle cx="286" cy="52" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M286 64 v18 M286 74 h8 M286 82 h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
    ),
    // A candlestick chart wearing the ₿ badge — equity beta on crypto.
    'crypto-stocks': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            {[
                { x: 70, t: 84, b: 132, up: false }, { x: 112, t: 56, b: 112, up: true },
                { x: 154, t: 72, b: 128, up: false }, { x: 196, t: 38, b: 96, up: true },
            ].map((c) => (
                <g key={c.x} stroke="currentColor" strokeWidth="3">
                    <line x1={c.x} y1={c.t - 14} x2={c.x} y2={c.b + 14} strokeOpacity="0.55" />
                    <rect x={c.x - 10} y={c.t} width="20" height={c.b - c.t} fill="currentColor" fillOpacity={c.up ? 0.6 : 0.16} />
                </g>
            ))}
            <circle cx="254" cy="66" r="26" stroke="currentColor" strokeWidth="3.5" fill="currentColor" fillOpacity="0.12" />
            <text x="254" y="76" fontSize="28" fontWeight="700" fill="currentColor" textAnchor="middle">₿</text>
        </>
    ),
    // A small sprout outgrowing measured rows — the up-and-comers.
    'small-mid': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.25" />
            {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="36" y1={126 - i * 30} x2="284" y2={126 - i * 30} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="3 7" />
            ))}
            {[
                { x: 84, h: 34 }, { x: 132, h: 52 }, { x: 180, h: 44 },
            ].map((b) => (
                <rect key={b.x} x={b.x - 13} y={150 - b.h} width="26" height={b.h} rx="3" fill="currentColor" fillOpacity="0.3" />
            ))}
            <path d="M236 150 V84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M236 100 C222 96, 214 84, 214 70 c14 0 22 10 22 30 M236 88 C250 84, 258 72, 258 58 c-14 0 -22 10 -22 30" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </>
    ),
};

export default function StockArt({ category, className }: { category: string; className?: string }) {
    const scene = SCENES[category] ?? SCENES['mega-caps'];
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

/**
 * LearnArt — original, hand-built SVG illustrations, one per article topic.
 * Pure vector (no images, no network), drawn with currentColor so each scene
 * inherits its category accent. Decorative; sits over the category gradient.
 */

import type { CategoryId } from '@/lib/learn';
import { cn } from '@/lib/utils';

const VB = '0 0 320 180';

// Each scene returns the inner SVG nodes; the wrapper supplies <svg>.
const SCENES: Record<string, React.ReactNode> = {
    // Economics ----------------------------------------------------------------
    'economic-recessions': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 6" />
            <polyline points="24,46 70,72 108,58 150,96 196,80 244,128 292,150" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M292 150 l-16 -6 M292 150 l-6 -16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="24" cy="46" r="4" fill="currentColor" />
        </>
    ),
    'inflation-explained': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={40 + i * 52} y={132 - i * 24} width="30" height={18 + i * 24} rx="3" fill="currentColor" fillOpacity={0.25 + i * 0.12} />
            ))}
            <path d="M40 70 C120 50, 200 36, 300 22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M300 22 l-16 1 M300 22 l-5 -15" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </>
    ),
    stagflation: (
        <>
            <line x1="40" y1="92" x2="180" y2="92" stroke="currentColor" strokeWidth="3" strokeOpacity="0.35" strokeDasharray="2 8" strokeLinecap="round" />
            <path d="M230 150 V44 M230 44 l-12 16 M230 44 l12 16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M110 40 V120 M110 120 l-12 -16 M110 120 l12 -16" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="244" y="40" fontSize="22" fontWeight="700" fill="currentColor">%</text>
        </>
    ),
    'quantitative-easing': (
        <>
            {[26, 52, 80, 110].map((r, i) => (
                <path key={r} d={`M${160 - r} 156 a${r} ${r} 0 0 1 ${2 * r} 0`} stroke="currentColor" strokeWidth="3" strokeOpacity={0.55 - i * 0.12} fill="none" />
            ))}
            <circle cx="120" cy="70" r="9" fill="currentColor" fillOpacity="0.5" />
            <circle cx="170" cy="50" r="7" fill="currentColor" fillOpacity="0.7" />
            <circle cx="205" cy="78" r="6" fill="currentColor" fillOpacity="0.4" />
            <text x="112" y="78" fontSize="13" fontWeight="700" fill="currentColor" fillOpacity="0.9">$</text>
        </>
    ),
    'fed-interest-rates': (
        <>
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={30 + i * 60} y={140 - i * 28} width="60" height={28 + i * 28} fill="currentColor" fillOpacity={0.18 + i * 0.12} />
            ))}
            <circle cx="282" cy="44" r="16" stroke="currentColor" strokeWidth="3" fill="none" />
            <text x="282" y="50" fontSize="16" fontWeight="700" fill="currentColor" textAnchor="middle">%</text>
        </>
    ),
    'yield-curve': (
        <>
            <line x1="28" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            <line x1="28" y1="30" x2="28" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            <path d="M30 120 C110 70, 200 52, 300 46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M30 70 C120 96, 210 120, 300 132" stroke="currentColor" strokeWidth="3" strokeOpacity="0.45" strokeDasharray="6 6" strokeLinecap="round" fill="none" />
        </>
    ),
    // Basics -------------------------------------------------------------------
    'risk-vs-reward': (
        <>
            <line x1="160" y1="30" x2="160" y2="150" stroke="currentColor" strokeWidth="3" strokeOpacity="0.4" />
            <path d="M140 150 h40 l-20 -22 z" fill="currentColor" fillOpacity="0.5" />
            <line x1="80" y1="58" x2="240" y2="46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="80" cy="58" r="18" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="240" cy="46" r="18" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.18" />
            <line x1="80" y1="58" x2="80" y2="40" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
            <line x1="240" y1="46" x2="240" y2="28" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
        </>
    ),
    diversification: (
        <>
            <circle cx="160" cy="92" r="56" stroke="currentColor" strokeWidth="22" strokeOpacity="0.14" fill="none" />
            <path d="M160 92 L160 36 A56 56 0 0 1 209 120 Z" fill="currentColor" fillOpacity="0.6" />
            <path d="M160 92 L209 120 A56 56 0 0 1 120 138 Z" fill="currentColor" fillOpacity="0.38" />
            <path d="M160 92 L120 138 A56 56 0 0 1 160 36 Z" fill="currentColor" fillOpacity="0.22" />
        </>
    ),
    'bull-and-bear-markets': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.18" />
            {[
                { x: 50, t: 60, b: 110, up: true },
                { x: 95, t: 50, b: 96, up: true },
                { x: 140, t: 70, b: 120, up: false },
                { x: 185, t: 44, b: 88, up: true },
                { x: 230, t: 64, b: 116, up: false },
                { x: 275, t: 38, b: 80, up: true },
            ].map((c) => (
                <g key={c.x} stroke="currentColor" strokeWidth="3">
                    <line x1={c.x} y1={c.t - 12} x2={c.x} y2={c.b + 12} strokeOpacity="0.6" />
                    <rect x={c.x - 9} y={c.t} width="18" height={c.b - c.t} fill="currentColor" fillOpacity={c.up ? 0.6 : 0.18} />
                </g>
            ))}
        </>
    ),
    'dollar-cost-averaging': (
        <>
            <line x1="20" y1="150" x2="300" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={36 + i * 44} y={150 - 16} width="22" height="16" rx="2" fill="currentColor" fillOpacity="0.3" />
            ))}
            <polyline points="47,130 91,118 135,122 179,98 223,86 267,58" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {[[47,130],[91,118],[135,122],[179,98],[223,86],[267,58]].map(([x,y]) => (
                <circle key={x} cx={x} cy={y} r="3.5" fill="currentColor" />
            ))}
        </>
    ),
    // ETFs ---------------------------------------------------------------------
    'etfs-vs-mutual-funds': (
        <>
            <rect x="46" y="40" width="228" height="100" rx="12" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.55" />
            {[0, 1, 2].map((c) =>
                [0, 1].map((r) => (
                    <rect key={`${c}-${r}`} x={66 + c * 66} y={58 + r * 42} width="50" height="30" rx="4" fill="currentColor" fillOpacity={0.2 + ((c + r) % 3) * 0.16} />
                ))
            )}
        </>
    ),
    // Dividends ----------------------------------------------------------------
    'dividends-explained': (
        <>
            {[0, 1, 2, 3].map((i) => (
                <ellipse key={i} cx="120" cy={140 - i * 22} rx="40" ry="13" fill="currentColor" fillOpacity={0.55 - i * 0.1} stroke="currentColor" strokeWidth="2" />
            ))}
            <text x="120" y="60" fontSize="20" fontWeight="700" fill="currentColor" textAnchor="middle">$</text>
            <path d="M200 96 a40 40 0 1 1 -8 -30" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M192 66 l8 -2 l-1 12 z" fill="currentColor" />
        </>
    ),
    // Bonds --------------------------------------------------------------------
    'bonds-101': (
        <>
            <path d="M150 150 h40 l-20 -20 z" fill="currentColor" fillOpacity="0.5" />
            <line x1="60" y1="60" x2="260" y2="120" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="60" r="20" fill="currentColor" fillOpacity="0.55" />
            <circle cx="260" cy="120" r="20" stroke="currentColor" strokeWidth="3" fill="none" />
            <text x="60" y="66" fontSize="15" fontWeight="700" fill="currentColor" textAnchor="middle" fillOpacity="0.95">P</text>
            <text x="260" y="126" fontSize="15" fontWeight="700" fill="currentColor" textAnchor="middle">Y</text>
        </>
    ),
    // Risk ---------------------------------------------------------------------
    'market-bubbles': (
        <>
            <circle cx="90" cy="100" r="30" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" />
            <circle cx="150" cy="62" r="18" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
            <circle cx="120" cy="140" r="12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
            <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <circle cx="225" cy="86" r="30" fill="none" strokeDasharray="3 7" strokeOpacity="0.8" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                    const r1 = 34, r2 = 48;
                    const rad = (a * Math.PI) / 180;
                    return <line key={a} x1={225 + r1 * Math.cos(rad)} y1={86 + r1 * Math.sin(rad)} x2={225 + r2 * Math.cos(rad)} y2={86 + r2 * Math.sin(rad)} />;
                })}
            </g>
        </>
    ),
};

const CATEGORY_FALLBACK: Record<CategoryId, string> = {
    basics: 'risk-vs-reward',
    economics: 'yield-curve',
    etfs: 'etfs-vs-mutual-funds',
    dividends: 'dividends-explained',
    bonds: 'bonds-101',
    risk: 'market-bubbles',
};

export default function LearnArt({
    slug,
    category,
    className,
}: {
    slug: string;
    category: CategoryId;
    className?: string;
}) {
    const scene = SCENES[slug] ?? SCENES[CATEGORY_FALLBACK[category]];
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

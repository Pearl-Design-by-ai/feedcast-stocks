/**
 * Market Pulse tape — the thin, full-width ticker ribbon under the header.
 * The market's most iconic artifact, rendered from our own EOD signal data:
 * a session badge (pre-market / open / after hours / closed) with a breathing
 * dot while the market is open, then the four majors and the sector board on
 * a seamless CSS marquee that pauses on hover.
 *
 * Server component — data comes from the engine's signals report (KV-cached
 * ~30min app-side, ~6h engine-side), so it adds no per-view engine load. It
 * renders nothing when the engine is unreachable.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSignalsReport } from '@/lib/signals-scan';

type Session = { label: string; tone: 'open' | 'edge' | 'closed' };

/** Current US-equity session from the New York wall clock. */
function usSession(now: Date = new Date()): Session {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const wd = get('weekday');
    const mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);

    if (wd === 'Sat' || wd === 'Sun') return { label: 'Market closed', tone: 'closed' };
    if (mins >= 4 * 60 && mins < 9 * 60 + 30) return { label: 'Pre-market', tone: 'edge' };
    if (mins >= 9 * 60 + 30 && mins < 16 * 60) return { label: 'Market open', tone: 'open' };
    if (mins >= 16 * 60 && mins < 20 * 60) return { label: 'After hours', tone: 'edge' };
    return { label: 'Market closed', tone: 'closed' };
}

const SESSION_TONE: Record<Session['tone'], { dot: string; text: string }> = {
    open: { dot: 'bg-green-400 text-green-400 fc-breathe', text: 'text-green-400' },
    edge: { dot: 'bg-amber-300 text-amber-300', text: 'text-amber-300' },
    closed: { dot: 'bg-gray-500 text-gray-500', text: 'text-gray-500' },
};

interface TapeItem {
    key: string;
    name: string;
    href: string;
    last: number | null;
    changePct: number | null;
}

function TapeEntry({ it }: { it: TapeItem }) {
    const up = (it.changePct ?? 0) >= 0;
    return (
        <Link
            href={it.href}
            className="flex shrink-0 items-baseline gap-1.5 px-4 text-[11px] transition-colors hover:text-gray-200"
        >
            <span className="font-semibold uppercase tracking-wide text-gray-400">{it.name}</span>
            {it.last != null && (
                <span className="tabular-nums text-gray-300">
                    {it.last.toLocaleString('en-US', { maximumFractionDigits: it.last >= 1000 ? 0 : 2 })}
                </span>
            )}
            {it.changePct != null && (
                <span
                    className={cn(
                        'tabular-nums px-0.5',
                        up ? 'text-green-400 fc-tick-up' : 'text-red-400 fc-tick-down',
                    )}
                >
                    {up ? '▲' : '▼'} {Math.abs(it.changePct).toFixed(2)}%
                </span>
            )}
        </Link>
    );
}

export default async function MarketPulseTape() {
    const r = await getSignalsReport();
    if (!r || r.indices.length === 0) return null;

    const items: TapeItem[] = [
        ...r.indices.map((s) => ({ key: s.key, name: s.name, href: '/buy-sell-signals', last: s.last, changePct: s.dayChangePct })),
        ...r.sectors.map((s) => ({ key: s.key, name: s.name, href: '/sectors', last: s.last, changePct: s.dayChangePct })),
    ];
    if (items.length === 0) return null;

    const session = usSession();
    const tone = SESSION_TONE[session.tone];
    // Slower with more content so the read speed stays constant.
    const speed = `${Math.max(40, items.length * 5)}s`;

    const run = items.map((it) => <TapeEntry key={it.key} it={it} />);

    return (
        <div className="flex h-8 w-full items-stretch border-b border-gray-800 bg-gray-900/80">
            {/* Session badge — fixed, outside the scroll. */}
            <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-gray-800 bg-gray-900 px-3 md:px-4">
                <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap', tone.text)}>
                    {session.label}
                </span>
            </div>
            {/* The tape. Content is rendered twice for a seamless loop. */}
            <div className="fc-tape relative min-w-0 flex-1 overflow-hidden" role="marquee" aria-label="Market pulse — indices and sectors, end-of-day">
                <div className="fc-tape-track flex w-max items-center" style={{ '--fc-tape-speed': speed } as React.CSSProperties}>
                    <div className="flex items-center py-1.5">{run}</div>
                    <div className="flex items-center py-1.5" aria-hidden="true">{run}</div>
                </div>
                {/* Edge fades so entries dissolve instead of clipping. */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-gray-900/80 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-900/80 to-transparent" />
            </div>
        </div>
    );
}

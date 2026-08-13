'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2 } from 'lucide-react';
import { cn, formatEodDate } from '@/lib/utils';
import type { ValuationEntry, ValuationScreen } from '@/lib/valuation';

/** Which multiple the two lists are ranked by. */
type Basis = 'pe' | 'fpe';

const ratio = (v: number | null) => (v == null ? '—' : v.toFixed(1));
const money = (v: number | null) => (v == null ? '—' : `$${v.toFixed(2)}`);
const pct = (v: number | null, signed = false) =>
    v == null ? '—' : `${signed && v > 0 ? '+' : ''}${v.toFixed(1)}%`;

/** Market cap comes in millions USD. */
function marketCap(m: number | null) {
    if (m == null) return '—';
    if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(2)}T`;
    if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
    return `$${Math.round(m)}M`;
}

function RangeCell({ price, lo, hi }: { price: number | null; lo: number | null; hi: number | null }) {
    if (price == null || lo == null || hi == null || hi <= lo) return <span className="text-gray-600">—</span>;
    const posPct = Math.max(0, Math.min(100, ((price - lo) / (hi - lo)) * 100));
    return (
        <div className="flex items-center gap-1.5">
            <span className="w-9 text-right text-[10px] tabular-nums text-gray-600">{lo.toFixed(0)}</span>
            <div className="relative h-1.5 w-20 rounded-full bg-gray-800">
                <div
                    className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-teal-400"
                    style={{ left: `calc(${posPct}% - 2px)` }}
                />
            </div>
            <span className="w-9 text-[10px] tabular-nums text-gray-600">{hi.toFixed(0)}</span>
        </div>
    );
}

const TH = 'px-3 py-2 text-right';

/** Rich table — web only. Both multiples lead; the ranking one is highlighted. */
function Table({ rows, peClass, basis }: { rows: ValuationEntry[]; peClass: string; basis: Basis }) {
    return (
        <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1200px] text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className={cn(TH, basis === 'pe' && 'text-gray-300')}>P/E</th>
                        <th className={cn(TH, basis === 'fpe' && 'text-gray-300')}>Fwd P/E</th>
                        <th className={TH}>Price</th>
                        <th className={TH}>Mkt cap</th>
                        <th className={TH}>P/S</th>
                        <th className={TH}>P/B</th>
                        <th className={TH}>Div yld</th>
                        <th className={TH}>ROE</th>
                        <th className={TH}>Net mgn</th>
                        <th className={TH}>Rev gr</th>
                        <th className={TH}>1Y</th>
                        <th className={TH}>Beta</th>
                        <th className="px-3 py-2">52-week range</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={r.symbol} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                            <td className="px-3 py-2 tabular-nums text-gray-600">{i + 1}</td>
                            <td className="px-3 py-2">
                                <Link href={`/stocks/${r.symbol}`} className="font-semibold text-gray-100 hover:text-teal-400">
                                    {r.symbol}
                                </Link>
                            </td>
                            <td className={cn('px-3 py-2 text-right tabular-nums', basis === 'pe' ? cn('font-semibold', peClass) : 'text-gray-400')}>
                                {ratio(r.pe)}
                            </td>
                            <td className={cn('px-3 py-2 text-right tabular-nums', basis === 'fpe' ? cn('font-semibold', peClass) : 'text-gray-400')}>
                                {ratio(r.fpe)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-200">{money(r.price)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-300">{marketCap(r.mktCap)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{ratio(r.ps)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{ratio(r.pb)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{pct(r.dy)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{pct(r.roe)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{pct(r.npm)}</td>
                            <td className={cn('px-3 py-2 text-right tabular-nums', r.revGrowth != null && r.revGrowth < 0 ? 'text-red-400' : 'text-gray-300')}>
                                {pct(r.revGrowth, true)}
                            </td>
                            <td className={cn('px-3 py-2 text-right tabular-nums', r.ret1y != null && r.ret1y < 0 ? 'text-red-400' : 'text-emerald-400')}>
                                {pct(r.ret1y, true)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">{ratio(r.beta)}</td>
                            <td className="px-3 py-2">
                                <RangeCell price={r.price} lo={r.lo52} hi={r.hi52} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** Simple stacked list — mobile only. The ranking multiple leads, the other trails it. */
function MobileList({ rows, peClass, basis }: { rows: ValuationEntry[]; peClass: string; basis: Basis }) {
    return (
        <ul className="space-y-1.5 md:hidden">
            {rows.map((r, i) => (
                <li key={r.symbol} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-gray-600">{i + 1}</span>
                        <div className="min-w-0">
                            <Link href={`/stocks/${r.symbol}`} className="font-semibold text-gray-100 hover:text-teal-400">{r.symbol}</Link>
                            <div className="text-[11px] tabular-nums text-gray-500">{money(r.price)} · {marketCap(r.mktCap)}</div>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <div className={cn('text-base font-bold tabular-nums', peClass)}>
                            {ratio(basis === 'fpe' ? r.fpe : r.pe)}{' '}
                            <span className="text-[10px] font-normal text-gray-500">{basis === 'fpe' ? 'Fwd P/E' : 'P/E'}</span>
                        </div>
                        <div className="text-[11px] tabular-nums text-gray-500">
                            {ratio(basis === 'fpe' ? r.pe : r.fpe)} {basis === 'fpe' ? 'P/E' : 'Fwd P/E'}
                        </div>
                        <div className={cn('text-[11px] tabular-nums', r.ret1y != null && r.ret1y < 0 ? 'text-red-400' : 'text-emerald-400')}>
                            {pct(r.ret1y, true)} 1Y
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function ValuationLists({ screen }: { screen: ValuationScreen | null }) {
    const [tab, setTab] = useState<'cheapest' | 'priciest'>('cheapest');
    const [basis, setBasis] = useState<Basis>('pe');

    if (!screen || (screen.cheapest.length === 0 && screen.priciest.length === 0)) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                Building this session&apos;s valuation screen — pulling data across ~230 large-caps.
                Check back shortly; it refills after each market close.
            </div>
        );
    }

    // A screen built before the forward-P/E change carries no forward lists — stay
    // on the trailing ranking until the next engine scan tick rebuilds it.
    const forwardReady = (screen.cheapestF?.length ?? 0) > 0 || (screen.priciestF?.length ?? 0) > 0;
    const activeBasis: Basis = forwardReady ? basis : 'pe';
    const lists =
        activeBasis === 'fpe'
            ? { cheapest: screen.cheapestF ?? [], priciest: screen.priciestF ?? [] }
            : { cheapest: screen.cheapest, priciest: screen.priciest };
    const rows = tab === 'cheapest' ? lists.cheapest : lists.priciest;
    const scored = activeBasis === 'fpe' ? screen.scannedF ?? rows.length : screen.scanned;
    const asOf = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }).format(new Date(screen.asOf));

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab('cheapest')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'cheapest' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/40' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'
                    )}
                >
                    <ArrowDownWideNarrow size={15} /> Cheapest {lists.cheapest.length}
                </button>
                <button
                    type="button"
                    onClick={() => setTab('priciest')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'priciest' ? 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-400/40' : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'
                    )}
                >
                    <ArrowUpWideNarrow size={15} /> Most expensive {lists.priciest.length}
                </button>
                {forwardReady && (
                    <div className="flex items-center gap-1 rounded-lg bg-gray-800/60 p-0.5" role="group" aria-label="Rank by">
                        <span className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rank by</span>
                        {(
                            [
                                { id: 'pe', label: 'P/E' },
                                { id: 'fpe', label: 'Fwd P/E' },
                            ] as { id: Basis; label: string }[]
                        ).map((b) => (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => setBasis(b.id)}
                                aria-pressed={activeBasis === b.id}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    activeBasis === b.id ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                                )}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                )}
                <span className="ml-auto text-[11px] text-gray-500">
                    {scored}/{screen.universe} scored · data through {formatEodDate(screen.session)} close (EOD) · rebuilt {asOf} ET
                </span>
            </div>

            <MobileList rows={rows} peClass={tab === 'cheapest' ? 'text-emerald-400' : 'text-red-400'} basis={activeBasis} />
            <Table rows={rows} peClass={tab === 'cheapest' ? 'text-emerald-400' : 'text-red-400'} basis={activeBasis} />

            <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                {activeBasis === 'fpe' ? (
                    <>
                        Ranked by forward P/E — price ÷ next-twelve-month consensus earnings estimate
                        (lower = cheaper on expected earnings). {screen.noForward ?? 0} names are excluded
                        for having no positive forward estimate. Forward multiples rest on analyst
                        forecasts, so they move when estimates are revised, not only when price moves.{' '}
                    </>
                ) : (
                    <>
                        Ranked by trailing P/E (lower = cheaper on earnings). {screen.noEarnings} names are
                        excluded for having no positive trailing earnings.{' '}
                    </>
                )}
                ROE, net margin and revenue growth
                are trailing; the 52-week range marks where the last price sits between its low and
                high. A low P/E isn&apos;t automatically a bargain — it can flag a value trap or a
                cyclical peak. Screen, not advice.
            </p>
        </div>
    );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2 } from 'lucide-react';
import { cn, formatEodDate } from '@/lib/utils';
import type { ValuationEntry, ValuationScreen, ScreenExclusion } from '@/lib/valuation';
import { PEG_EXCLUSION_LABEL } from '@/lib/valuation';

/** Which multiple the two lists are ranked by. */
type Basis = 'pe' | 'fpe' | 'peg' | 'fpeg';

/** Column label per basis, plus the one shown next to it on mobile. */
const BASIS_META: Record<Basis, { label: string; sibling: Basis }> = {
    pe: { label: 'P/E', sibling: 'fpe' },
    fpe: { label: 'Fwd P/E', sibling: 'pe' },
    peg: { label: 'PEG (TTM)', sibling: 'fpeg' },
    fpeg: { label: 'PEG (FWD)', sibling: 'peg' },
};

/**
 * Exactly what each multiple divides by. The PEG columns carry this because
 * "PEG" alone hid a denominator nobody could see: both columns used to be the
 * data provider's own composite, and a base-effect growth rate off a depressed
 * prior year put names like MPC and AMT at the top of the "cheapest" list.
 */
const BASIS_TOOLTIP: Record<Basis, string> = {
    pe: 'Trailing P/E — price ÷ trailing-twelve-month earnings per share.',
    fpe: 'Forward P/E — price ÷ next-twelve-month consensus earnings per share.',
    peg:
        'PEG (TTM) — trailing P/E ÷ trailing EPS growth, using a 3-year EPS CAGR ' +
        '(5-year, then 1-year, as fallbacks). A multi-year CAGR is used because a ' +
        'single year against a depressed base reads as spectacular growth and makes ' +
        'an expensive stock look cheap. Shown as n/m when a plausibility guard fires.',
    fpeg:
        'PEG (FWD) — forward P/E ÷ forward EPS growth, where growth is derived from ' +
        'the two multiples on this row: trailing P/E ÷ forward P/E = 1 + growth. ' +
        'That is next-twelve-month consensus against trailing-twelve-month actual, ' +
        'not next fiscal year against current. Shown as n/m when a guard fires.',
};

/** Below this many ranked names a measure is still filling in — don't offer it. */
const MIN_RANKED = 20;

const ratio = (v: number | null) => (v == null ? '—' : v.toFixed(1));
/**
 * PEG clusters around 1, so it earns a second decimal that a P/E doesn't.
 * A null PEG is "not meaningful", not "missing": the engine computed it and a
 * guard rejected it. "n/m" says that; an em dash would read as absent data.
 */
const pegRatio = (v: number | null) => (v == null ? 'n/m' : v.toFixed(2));
const byBasis = (r: ValuationEntry, b: Basis) =>
    b === 'peg' || b === 'fpeg' ? pegRatio(r[b]) : ratio(r[b]);
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

/**
 * "N names are excluded" only ever said how many, never why — so a broken growth
 * feed and a quiet market produced the same sentence. The engine now reports a
 * reason code per suppressed value; this turns those into readable counts,
 * ordered biggest first.
 *
 * Returns null when the served screen predates the audit, so the caller keeps
 * the plain count instead of rendering an empty clause.
 */
function exclusionBreakdown(
    exclusions: ScreenExclusion[] | undefined,
    scope: ScreenExclusion['scope'],
): string | null {
    if (!exclusions?.length) return null;
    const counts = new Map<string, number>();
    for (const x of exclusions) {
        if (x.scope !== scope) continue;
        counts.set(x.reason, (counts.get(x.reason) ?? 0) + 1);
    }
    if (!counts.size) return null;
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([reason, n]) => `${n} ${PEG_EXCLUSION_LABEL[reason] ?? reason}`)
        .join(', ');
}

/** Rich table — web only. Both multiples lead; the ranking one is highlighted. */
function Table({ rows, peClass, basis }: { rows: ValuationEntry[]; peClass: string; basis: Basis }) {
    return (
        <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1360px] text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className={cn(TH, 'cursor-help', basis === 'pe' && 'text-gray-300')} title={BASIS_TOOLTIP.pe}>P/E</th>
                        <th className={cn(TH, 'cursor-help', basis === 'fpe' && 'text-gray-300')} title={BASIS_TOOLTIP.fpe}>Fwd P/E</th>
                        <th className={cn(TH, 'cursor-help', basis === 'peg' && 'text-gray-300')} title={BASIS_TOOLTIP.peg}>PEG (TTM)</th>
                        <th className={cn(TH, 'cursor-help', basis === 'fpeg' && 'text-gray-300')} title={BASIS_TOOLTIP.fpeg}>PEG (FWD)</th>
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
                            <td className={cn('px-3 py-2 text-right tabular-nums', basis === 'peg' ? cn('font-semibold', peClass) : 'text-gray-400')}>
                                {pegRatio(r.peg)}
                            </td>
                            <td className={cn('px-3 py-2 text-right tabular-nums', basis === 'fpeg' ? cn('font-semibold', peClass) : 'text-gray-400')}>
                                {pegRatio(r.fpeg)}
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
                            {byBasis(r, basis)}{' '}
                            <span className="text-[10px] font-normal text-gray-500">{BASIS_META[basis].label}</span>
                        </div>
                        <div className="text-[11px] tabular-nums text-gray-500">
                            {byBasis(r, BASIS_META[basis].sibling)} {BASIS_META[BASIS_META[basis].sibling].label}
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

    // A screen built by an engine older than a given ranking carries no lists for
    // it — that basis is simply not offered until the next scan tick rebuilds the
    // screen. Trailing P/E has always been there, so it is the safe fallback.
    const byRanking: Record<Basis, { cheapest: ValuationEntry[]; priciest: ValuationEntry[] }> = {
        pe: { cheapest: screen.cheapest, priciest: screen.priciest },
        fpe: { cheapest: screen.cheapestF ?? [], priciest: screen.priciestF ?? [] },
        peg: { cheapest: screen.cheapestP ?? [], priciest: screen.priciestP ?? [] },
        fpeg: { cheapest: screen.cheapestFP ?? [], priciest: screen.priciestFP ?? [] },
    };
    // A ranking is only offered once it has enough names to be a screen rather
    // than a handful — the engine refills the universe a chunk at a time after
    // each close, so a just-added measure would otherwise flash a 10-row list.
    const available = (['pe', 'fpe', 'peg', 'fpeg'] as Basis[]).filter(
        (b) => b === 'pe' || byRanking[b].cheapest.length >= MIN_RANKED || byRanking[b].priciest.length >= MIN_RANKED
    );
    const activeBasis: Basis = available.includes(basis) ? basis : 'pe';
    const lists = byRanking[activeBasis];
    const rows = tab === 'cheapest' ? lists.cheapest : lists.priciest;
    const scoredBy: Record<Basis, number | undefined> = {
        pe: screen.scanned,
        fpe: screen.scannedF,
        peg: screen.scannedP,
        fpeg: screen.scannedFP,
    };
    const scored = scoredBy[activeBasis] ?? rows.length;
    // Why names dropped out, not just how many. Null on a screen from an engine
    // build that predates the audit — the footnote then keeps its plain count.
    const pegExcluded = exclusionBreakdown(screen.exclusions, 'peg');
    const fpegExcluded = exclusionBreakdown(screen.exclusions, 'fpeg');
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
                {available.length > 1 && (
                    <div className="flex items-center gap-1 rounded-lg bg-gray-800/60 p-0.5" role="group" aria-label="Rank by">
                        <span className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rank by</span>
                        {available.map((b) => (
                            <button
                                key={b}
                                type="button"
                                onClick={() => setBasis(b)}
                                aria-pressed={activeBasis === b}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    activeBasis === b ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                                )}
                            >
                                {BASIS_META[b].label}
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
                {activeBasis === 'fpe' && (
                    <>
                        Ranked by forward P/E — price ÷ next-twelve-month consensus earnings estimate
                        (lower = cheaper on expected earnings). {screen.noForward ?? 0} names are excluded
                        for having no positive forward estimate. Forward multiples rest on analyst
                        forecasts, so they move when estimates are revised, not only when price moves.{' '}
                    </>
                )}
                {activeBasis === 'peg' && (
                    <>
                        Ranked by PEG (TTM) — trailing P/E ÷ a 3-year EPS CAGR, so a fast grower
                        on a high multiple can still screen cheap (under ~1 is the classic &ldquo;growth
                        you aren&apos;t paying for&rdquo; marker). A multi-year CAGR is used rather than
                        a one-year change: a single year against a depressed base reads as spectacular
                        growth and makes an expensive stock look cheap. {screen.noPeg ?? 0} names are
                        excluded{pegExcluded ? <> — {pegExcluded}</> : <> for having no positive PEG</>}.{' '}
                    </>
                )}
                {activeBasis === 'fpeg' && (
                    <>
                        Ranked by PEG (FWD) — forward P/E ÷ forward EPS growth, derived from the two
                        multiples on each row (trailing P/E ÷ forward P/E = 1 + growth). The same
                        growth-adjusted read as PEG (TTM), but on the year ahead rather than the year
                        behind. {screen.noFpeg ?? 0} names are excluded
                        {fpegExcluded ? <> — {fpegExcluded}</> : <> for having no positive forward PEG</>};
                        the growth rate is an analyst estimate that can be revised.{' '}
                    </>
                )}
                {activeBasis === 'pe' && (
                    <>
                        Ranked by trailing P/E (lower = cheaper on earnings). {screen.noEarnings} names are
                        excluded for having no positive trailing earnings.{' '}
                    </>
                )}
                ROE, net margin and revenue growth
                are trailing; the 52-week range marks where the last price sits between its low and
                high. Revenue growth is withheld for banks and insurers, whose reported revenue is
                gross interest income rather than net revenue.{' '}
                {!!screen.suppressedRows && (
                    <>
                        {screen.suppressedRows} row{screen.suppressedRows === 1 ? '' : 's'} withheld
                        entirely for having no price this session.{' '}
                    </>
                )}
                A low P/E isn&apos;t automatically a bargain — it can flag a value trap or a
                cyclical peak. Screen, not advice.
            </p>
        </div>
    );
}

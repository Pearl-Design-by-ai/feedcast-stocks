/**
 * Server-rendered enrichment panels for the stock detail page — all free-tier
 * data: Finnhub metric/earnings/peers/insider endpoints (KV-cached via
 * fetchJSON), the shared earnings calendar, company news, and an EOD
 * technical snapshot computed from 2y of Yahoo daily closes (cached 6h).
 * Each panel renders nothing when its data is unavailable.
 */

import Link from 'next/link';
import {
    getKeyMetrics,
    getEpsSurprises,
    getPeers,
    getInsiderActivity,
} from '@/lib/actions/stock-insights.actions';
import { getEarningsCalendar } from '@/lib/actions/calendar.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { fetchDailyCloses } from '@/lib/actions/returns.actions';
import { getQuoteMap } from '@/lib/quotes';
import { formatTimeAgo } from '@/lib/utils';

const fmt = (v: number | null, digits = 2, suffix = '') =>
    v != null ? `${v.toFixed(digits)}${suffix}` : '—';

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
                {note && <span className="text-[11px] text-gray-500">{note}</span>}
            </div>
            {children}
        </div>
    );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
    return (
        <div className="flex items-baseline justify-between gap-2 py-1">
            <span className="text-xs text-gray-500">{label}</span>
            <span
                className={`text-sm font-medium tabular-nums ${
                    tone === 'pos' ? 'text-green-400' : tone === 'neg' ? 'text-red-400' : 'text-gray-200'
                }`}
            >
                {value}
            </span>
        </div>
    );
}

/* 1 — Key fundamentals (zero extra cost: same metric=all response as P/E). */
export async function KeyStats({ symbol }: { symbol: string }) {
    const m = await getKeyMetrics(symbol);
    if (!m) return null;

    return (
        <Card title="Key Stats" note="TTM · Finnhub">
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">Valuation</p>
                    <StatRow label="P/E" value={fmt(m.peTTM, 1)} />
                    <StatRow label="P/S" value={fmt(m.psTTM, 1)} />
                    <StatRow label="P/B" value={fmt(m.pb, 1)} />
                    <StatRow label="EPS" value={m.epsTTM != null ? `$${m.epsTTM.toFixed(2)}` : '—'} />
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">Profitability</p>
                    <StatRow label="Gross margin" value={fmt(m.grossMargin, 1, '%')} />
                    <StatRow label="Op. margin" value={fmt(m.operatingMargin, 1, '%')} />
                    <StatRow label="Net margin" value={fmt(m.netMargin, 1, '%')} />
                    <StatRow label="ROE" value={fmt(m.roe, 1, '%')} />
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">Health & more</p>
                    <StatRow
                        label="Rev growth (YoY)"
                        value={fmt(m.revenueGrowthYoy, 1, '%')}
                        tone={m.revenueGrowthYoy == null ? undefined : m.revenueGrowthYoy >= 0 ? 'pos' : 'neg'}
                    />
                    <StatRow label="Beta" value={fmt(m.beta, 2)} />
                    <StatRow label="Div. yield" value={fmt(m.dividendYield, 2, '%')} />
                    <StatRow label="Debt/Equity" value={fmt(m.debtToEquity, 2)} />
                </div>
            </div>
        </Card>
    );
}

/* 2 + 3 — EPS surprise history + the next confirmed report date. */
export async function EarningsPanel({ symbol }: { symbol: string }) {
    const [surprises, calendar] = await Promise.all([
        getEpsSurprises(symbol),
        getEarningsCalendar(60).catch(() => []),
    ]);
    const next = calendar.find((e) => e.symbol.toUpperCase() === symbol.toUpperCase());
    if (surprises.length === 0 && !next) return null;

    return (
        <Card title="Earnings" note="EPS actual vs estimate">
            {next && (
                <p className="mb-3 rounded-lg bg-gray-800/60 px-3 py-2 text-xs text-gray-300">
                    Next report: <span className="font-semibold text-gray-100">{next.date}</span>
                    {next.epsEstimate != null && (
                        <> · est. EPS <span className="font-semibold text-gray-100">${next.epsEstimate.toFixed(2)}</span></>
                    )}
                </p>
            )}
            {surprises.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {surprises.map((s) => {
                        const beat = s.surprisePercent != null ? s.surprisePercent >= 0 : null;
                        return (
                            <div key={s.period} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5">
                                <p className="text-[11px] text-gray-500">{s.period}</p>
                                <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-100">
                                    {s.actual != null ? `$${s.actual.toFixed(2)}` : '—'}
                                </p>
                                <p className="text-[11px] tabular-nums text-gray-500">
                                    est. {s.estimate != null ? `$${s.estimate.toFixed(2)}` : '—'}
                                </p>
                                {beat != null && (
                                    <span
                                        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                            beat ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}
                                    >
                                        {beat ? 'Beat' : 'Miss'} {s.surprisePercent != null ? `${s.surprisePercent > 0 ? '+' : ''}${s.surprisePercent.toFixed(1)}%` : ''}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

/* 4 — Peers with live day moves, linking to their detail pages. */
export async function Peers({ symbol }: { symbol: string }) {
    const peers = await getPeers(symbol);
    if (peers.length === 0) return null;
    const quotes = await getQuoteMap(peers.slice(0, 6)).catch(
        () => new Map<string, { changePercent: number }>()
    );

    return (
        <Card title="Similar Companies" note="Finnhub peers">
            <div className="flex flex-wrap gap-2">
                {peers.map((p) => {
                    const q = quotes.get(p);
                    const dp = q?.changePercent;
                    return (
                        <Link
                            key={p}
                            href={`/stocks/${p}`}
                            className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-teal-400/50 hover:text-teal-300"
                        >
                            {p}
                            {dp != null && (
                                <span className={`tabular-nums font-medium ${dp >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {dp > 0 ? '+' : ''}
                                    {dp.toFixed(1)}%
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </Card>
    );
}

/* 5 — Insider transactions + monthly insider sentiment (MSPR). */
export async function InsiderActivity({ symbol }: { symbol: string }) {
    const data = await getInsiderActivity(symbol);
    if (!data) return null;
    const latest = data.sentiment[0];

    return (
        <Card title="Insider Activity" note="Last ~4 months · SEC filings">
            {latest && (
                <p className="mb-3 rounded-lg bg-gray-800/60 px-3 py-2 text-xs text-gray-300">
                    Insider sentiment ({latest.month}):{' '}
                    <span className={`font-semibold ${latest.mspr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latest.mspr >= 0 ? 'net buying' : 'net selling'} · MSPR {latest.mspr.toFixed(0)}
                    </span>
                </p>
            )}
            {data.transactions.length > 0 && (
                <div className="flex flex-col divide-y divide-gray-800/70">
                    {data.transactions.map((t, i) => {
                        const buying = (t.change ?? 0) > 0;
                        return (
                            <div key={`${t.name}-${t.transactionDate}-${i}`} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-gray-200">{t.name}</p>
                                    <p className="text-[11px] text-gray-500">
                                        {t.transactionDate}
                                        {t.transactionPrice != null && t.transactionPrice > 0 && ` · $${t.transactionPrice.toFixed(2)}`}
                                    </p>
                                </div>
                                <span className={`shrink-0 text-xs font-semibold tabular-nums ${buying ? 'text-green-400' : 'text-red-400'}`}>
                                    {buying ? '+' : ''}
                                    {t.change != null ? t.change.toLocaleString('en-US') : '—'} sh
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

/* 6 — Company news. */
export async function StockNews({ symbol }: { symbol: string }) {
    const news = await getNews([symbol.toUpperCase()]).catch(() => []);
    if (!news || news.length === 0) return null;

    return (
        <Card title="Company News" note="Finnhub">
            <div className="flex flex-col divide-y divide-gray-800/70">
                {news.slice(0, 6).map((a) => (
                    <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group py-2.5"
                    >
                        <p className="text-sm leading-snug text-gray-200 transition-colors group-hover:text-teal-300">
                            {a.headline}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                            {a.source} · {formatTimeAgo(a.datetime)}
                        </p>
                    </a>
                ))}
            </div>
        </Card>
    );
}

/* 7 — EOD technical snapshot from 2y of daily closes. */
export async function TechSnapshot({ symbol }: { symbol: string }) {
    const series = await fetchDailyCloses(symbol).catch(() => []);
    const closes = series.map((c) => c.close);
    const n = closes.length;
    if (n < 60) return null;

    const last = closes[n - 1];
    const at = (back: number) => (n - 1 - back >= 0 ? closes[n - 1 - back] : undefined);
    const ret = (past?: number) => (past && past > 0 ? (last / past - 1) * 100 : null);
    const year = new Date().getFullYear();
    const firstOfYear = series.find((c) => c.date.startsWith(`${year}-`))?.close;

    const win52 = closes.slice(-252);
    const hi52 = Math.max(...win52);
    const lo52 = Math.min(...win52);
    const rangePos = hi52 > lo52 ? ((last - lo52) / (hi52 - lo52)) * 100 : 50;

    const sma = (k: number) => {
        if (n < k) return null;
        let s = 0;
        for (let i = n - k; i < n; i++) s += closes[i];
        return s / k;
    };
    const sma50 = sma(50);
    const sma200 = sma(200);

    // RSI(14), Wilder-smoothed.
    let rsi: number | null = null;
    if (n >= 15) {
        let g = 0;
        let l = 0;
        for (let i = 1; i <= 14; i++) {
            const d = closes[i] - closes[i - 1];
            if (d >= 0) g += d;
            else l -= d;
        }
        let ag = g / 14;
        let al = l / 14;
        for (let i = 15; i < n; i++) {
            const d = closes[i] - closes[i - 1];
            ag = (ag * 13 + Math.max(d, 0)) / 14;
            al = (al * 13 + Math.max(-d, 0)) / 14;
        }
        rsi = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    }

    // 20d realized vol, annualized.
    let vol: number | null = null;
    if (n >= 21) {
        const rets: number[] = [];
        for (let i = n - 20; i < n; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
        const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
        vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
    }

    const returns: Array<[string, number | null]> = [
        ['1W', ret(at(5))],
        ['1M', ret(at(21))],
        ['3M', ret(at(63))],
        ['YTD', ret(firstOfYear)],
        ['1Y', ret(at(252))],
    ];

    return (
        <Card title="Technical Snapshot" note="EOD · 2y daily closes">
            <div className="mb-3 grid grid-cols-5 gap-2">
                {returns.map(([label, v]) => (
                    <div key={label} className="rounded-lg bg-gray-800/50 px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
                        <p
                            className={`mt-0.5 text-sm font-semibold tabular-nums ${
                                v == null ? 'text-gray-600' : v >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                        >
                            {v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                        </p>
                    </div>
                ))}
            </div>

            {/* 52-week range position */}
            <div className="mb-3">
                <div className="mb-1 flex justify-between text-[11px] tabular-nums text-gray-500">
                    <span>52W low ${lo52.toFixed(2)}</span>
                    <span>high ${hi52.toFixed(2)}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-800">
                    <div
                        className="absolute top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-full bg-teal-400"
                        style={{ left: `calc(${Math.min(100, Math.max(0, rangePos)).toFixed(1)}% - 3px)` }}
                        title={`${rangePos.toFixed(0)}% of the 52-week range`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                <StatRow
                    label="vs 50-day avg"
                    value={sma50 != null ? `${(((last - sma50) / sma50) * 100).toFixed(1)}%` : '—'}
                    tone={sma50 != null ? (last >= sma50 ? 'pos' : 'neg') : undefined}
                />
                <StatRow
                    label="vs 200-day avg"
                    value={sma200 != null ? `${(((last - sma200) / sma200) * 100).toFixed(1)}%` : '—'}
                    tone={sma200 != null ? (last >= sma200 ? 'pos' : 'neg') : undefined}
                />
                <StatRow
                    label="RSI (14)"
                    value={rsi != null ? rsi.toFixed(0) : '—'}
                    tone={rsi != null ? (rsi >= 70 ? 'neg' : rsi <= 30 ? 'pos' : undefined) : undefined}
                />
                <StatRow label="Realized vol (20d)" value={vol != null ? `${vol.toFixed(0)}%` : '—'} />
            </div>
        </Card>
    );
}

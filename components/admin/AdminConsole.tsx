'use client';

/**
 * Power-user Admin diagnostics console. Renders the engine's DiagnosticsReport —
 * upstream-feed health, EOD freshness, valuation cron progress, wired secrets
 * and operational notes — with a manual refresh that re-pulls the live report
 * via the server action. Pure presentation; all logic lives in the engine.
 */

import { useState, useTransition } from 'react';
import {
    Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle, Database,
    Gauge, KeyRound, Server, MinusCircle,
} from 'lucide-react';
import { getDiagnostics } from '@/lib/actions/admin.actions';
import type { DiagnosticsReport, ProbeStatus } from '@/lib/admin';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<ProbeStatus, string> = {
    ok: 'bg-emerald-500',
    stale: 'bg-amber-500',
    down: 'bg-red-500',
    unconfigured: 'bg-gray-600',
};
const STATUS_TEXT: Record<ProbeStatus, string> = {
    ok: 'text-emerald-400',
    stale: 'text-amber-400',
    down: 'text-red-400',
    unconfigured: 'text-gray-500',
};

function fmtTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York',
        }).format(new Date(iso)) + ' ET';
    } catch {
        return iso;
    }
}

const OVERALL_STYLE = {
    healthy: { ring: 'border-emerald-700/50 bg-emerald-950/30', text: 'text-emerald-400', Icon: CheckCircle2, label: 'All systems healthy' },
    degraded: { ring: 'border-amber-700/50 bg-amber-950/30', text: 'text-amber-400', Icon: AlertTriangle, label: 'Degraded — see notes' },
    down: { ring: 'border-red-700/50 bg-red-950/30', text: 'text-red-400', Icon: XCircle, label: 'Critical feed down' },
} as const;

export default function AdminConsole({ initial }: { initial: DiagnosticsReport }) {
    const [report, setReport] = useState<DiagnosticsReport>(initial);
    const [pending, start] = useTransition();
    const [err, setErr] = useState(false);

    const refresh = () =>
        start(async () => {
            setErr(false);
            const r = await getDiagnostics();
            if (r) setReport(r);
            else setErr(true);
        });

    const o = OVERALL_STYLE[report.overall];

    return (
        <div className="flex flex-col gap-5">
            {/* Status banner */}
            <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 md:p-5', o.ring)}>
                <div className="flex items-center gap-3">
                    <o.Icon className={cn('h-7 w-7', o.text)} />
                    <div>
                        <p className={cn('text-lg font-bold', o.text)}>{o.label}</p>
                        <p className="text-xs text-gray-400">
                            Last session <span className="font-mono text-gray-300">{report.session}</span> · refreshed {fmtTime(report.generatedAt)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-teal-600 hover:text-teal-400 disabled:opacity-50"
                >
                    <RefreshCw className={cn('h-4 w-4', pending && 'animate-spin')} />
                    {pending ? 'Probing…' : 'Refresh'}
                </button>
            </div>

            {err && (
                <p className="rounded-lg border border-red-800 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                    Engine unreachable on refresh — showing last good report.
                </p>
            )}

            {/* Notes */}
            {report.notes.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
                        <Activity className="h-4 w-4 text-amber-400" /> Operational notes
                    </h2>
                    <ul className="flex flex-col gap-1.5">
                        {report.notes.map((n, i) => (
                            <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-400">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                {n}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Feed probes */}
            <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Server className="h-4 w-4 text-teal-400" /> Data feeds
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {report.feeds.map((f) => (
                        <div key={f.key} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[f.status])} />
                                    <span className="text-sm font-medium text-gray-200">{f.label}</span>
                                </div>
                                <span className={cn('text-[11px] font-bold uppercase tracking-wide', STATUS_TEXT[f.status])}>{f.status}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-gray-400">{f.detail}</p>
                            {f.latencyMs != null && (
                                <p className="mt-1 text-[11px] tabular-nums text-gray-600">{f.latencyMs} ms</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* EOD freshness table */}
            <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Gauge className="h-4 w-4 text-teal-400" /> EOD close freshness
                    <span className="text-xs font-normal text-gray-500">
                        ({report.eod.symbols.length - report.eod.staleCount - report.eod.downCount} current ·
                        {' '}{report.eod.staleCount} stale · {report.eod.downCount} down)
                    </span>
                </h2>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-900/60 text-left text-[11px] uppercase tracking-wide text-gray-500">
                                <th className="px-3 py-2 font-semibold">Symbol</th>
                                <th className="px-3 py-2 font-semibold">Asset</th>
                                <th className="px-3 py-2 font-semibold">Last close date</th>
                                <th className="px-3 py-2 text-right font-semibold">Close</th>
                                <th className="px-3 py-2 text-right font-semibold">Behind</th>
                                <th className="px-3 py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.eod.symbols.map((s) => (
                                <tr key={s.symbol} className="border-b border-gray-800/60 last:border-0">
                                    <td className="px-3 py-2 font-mono text-gray-200">{s.symbol}</td>
                                    <td className="px-3 py-2 text-gray-400">{s.asset}</td>
                                    <td className="px-3 py-2 font-mono text-gray-300">{s.lastDate ?? '—'}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-gray-300">{s.lastClose != null ? s.lastClose.toLocaleString('en-US') : '—'}</td>
                                    <td className={cn('px-3 py-2 text-right tabular-nums', s.sessionsBehind ? 'text-amber-400' : 'text-gray-500')}>
                                        {s.sessionsBehind == null ? '—' : s.sessionsBehind === 0 ? '0' : `+${s.sessionsBehind}`}
                                    </td>
                                    <td className={cn('px-3 py-2 text-xs font-semibold uppercase', STATUS_TEXT[s.status])}>{s.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Valuation cron + secrets */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                        <Database className="h-4 w-4 text-teal-400" /> Valuation cron
                    </h2>
                    {report.valuation.built ? (
                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                            <dt className="text-gray-500">State</dt>
                            <dd className={report.valuation.complete ? 'text-emerald-400' : 'text-amber-400'}>
                                {report.valuation.complete ? 'Complete' : 'Building…'}
                            </dd>
                            <dt className="text-gray-500">Built for</dt>
                            <dd className="font-mono text-gray-300">{report.valuation.session ?? '—'}</dd>
                            <dt className="text-gray-500">Scanned</dt>
                            <dd className="tabular-nums text-gray-300">{report.valuation.scanned ?? '—'} / {report.valuation.universe ?? '—'}</dd>
                        </dl>
                    ) : (
                        <p className="text-sm text-gray-500">Not yet built (cold KV or first run).</p>
                    )}
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-100">
                        <KeyRound className="h-4 w-4 text-teal-400" /> Wired secrets
                    </h2>
                    <ul className="grid grid-cols-2 gap-y-2 text-sm">
                        {([
                            ['Engine token', report.config.engineToken],
                            ['AI key', report.config.deepseek],
                            ['Finnhub', report.config.finnhub],
                            ['Adanos', report.config.adanos],
                            ['KV cache', report.config.kvCache],
                        ] as const).map(([label, on]) => (
                            <li key={label} className="flex items-center gap-2">
                                {on ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <MinusCircle className="h-4 w-4 text-gray-600" />
                                )}
                                <span className={on ? 'text-gray-300' : 'text-gray-500'}>{label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

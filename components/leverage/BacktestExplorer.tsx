'use client';

/**
 * Client controls around the backtest section: the owner can switch the window
 * (6M / YTD / 1Y / Max), the rebalance cadence (daily / weekly) and the assumed
 * cost per trade, then export the result as CSV. The initial YTD/daily/3bps
 * result is server-rendered and passed in; other combinations are fetched on
 * demand through the server action (engine-cached) and memoized by combo so
 * re-selecting is instant.
 */

import { useRef, useState, useTransition } from 'react';
import { Loader2, Download, Copy, Check } from 'lucide-react';
import { getLeverageReport, type LevRange, type LevRebal } from '@/lib/actions/leverage.actions';
import type { LeverageBacktest } from '@/lib/leverage';
import { cn } from '@/lib/utils';
import { BacktestSection } from './LeverageUi';

const RANGES: { key: LevRange; label: string }[] = [
    { key: '6m', label: '6M' },
    { key: 'ytd', label: 'YTD' },
    { key: '1y', label: '1Y' },
    { key: 'max', label: 'Max' },
];
const REBALS: { key: LevRebal; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
];
const COSTS = [0, 3, 5, 10];

const comboKey = (r: LevRange, rb: LevRebal, c: number) => `${r}|${rb}|${c}`;

function buildCsv(bt: LeverageBacktest): string {
    const lines: string[] = [];
    lines.push(`# Leverage Rotation backtest — ${bt.label}, ${bt.rebal} rebalance, ${bt.costBps}bps cost, $100k start`);
    lines.push('pair,leg,endValue,totalReturnPct,maxDrawdownPct,avgLeveragedPct,startDate,endDate,days');
    for (const p of bt.pairs) {
        const legs: [string, typeof p.strategy][] = [
            [`Rotation(${p.leveragedSymbol}/${p.baseSymbol})`, p.strategy],
            [`Plain ${p.baseSymbol} 1x`, p.flat],
            [`BuyHold ${p.leveragedSymbol} 3x`, p.lev3x],
        ];
        for (const [name, leg] of legs) {
            lines.push(`${p.baseSymbol},${name},${leg.value},${leg.retPct},${leg.maxDdPct},${p.avgLeveragedPct},${p.startDate},${p.endDate},${p.days}`);
        }
    }
    lines.push('');
    lines.push('# equity curves ($)');
    const header = ['date'];
    for (const p of bt.pairs) header.push(`${p.baseSymbol}_rotation`, `${p.baseSymbol}_flat`, `${p.baseSymbol}_3x`);
    lines.push(header.join(','));
    const n = Math.min(...bt.pairs.map((p) => p.curve.length));
    for (let i = 0; i < n; i++) {
        const row = [bt.pairs[0].curve[i].date];
        for (const p of bt.pairs) {
            const c = p.curve[i];
            row.push(String(c.strat), String(c.flat), String(c.lev3x));
        }
        lines.push(row.join(','));
    }
    return lines.join('\n');
}

export default function BacktestExplorer({ initial }: { initial: LeverageBacktest }) {
    const [range, setRange] = useState<LevRange>((initial.range as LevRange) ?? 'ytd');
    const [rebal, setRebal] = useState<LevRebal>((initial.rebal as LevRebal) ?? 'daily');
    const [cost, setCost] = useState<number>(initial.costBps ?? 3);
    const [bt, setBt] = useState<LeverageBacktest | null>(initial);
    const [pending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);
    const cache = useRef<Record<string, LeverageBacktest | null>>({ [comboKey(initial.range as LevRange, initial.rebal as LevRebal, initial.costBps)]: initial });

    function load(r: LevRange, rb: LevRebal, c: number) {
        setRange(r);
        setRebal(rb);
        setCost(c);
        const key = comboKey(r, rb, c);
        const hit = cache.current[key];
        if (hit !== undefined) {
            setBt(hit);
            return;
        }
        startTransition(async () => {
            const res = await getLeverageReport(r, rb, c);
            const next = res?.backtest ?? null;
            cache.current[key] = next;
            setBt(next);
        });
    }

    function exportCsv() {
        if (!bt) return;
        const blob = new Blob([buildCsv(bt)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leverage-${bt.range}-${bt.rebal}-${bt.costBps}bps.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function copyCsv() {
        if (!bt) return;
        try {
            await navigator.clipboard.writeText(buildCsv(bt));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard blocked — the Export button still works.
        }
    }

    const Group = ({ children, label }: { children: React.ReactNode; label: string }) => (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
            <div className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-1">{children}</div>
        </div>
    );
    const pill = (active: boolean) =>
        cn('rounded-md px-2.5 py-1 text-xs font-semibold transition-colors', active ? 'bg-violet-500/20 text-violet-200 ring-1 ring-inset ring-violet-400/40' : 'text-gray-400 hover:text-gray-200');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Group label="Window">
                    {RANGES.map((r) => (
                        <button key={r.key} type="button" onClick={() => load(r.key, rebal, cost)} aria-pressed={range === r.key} className={pill(range === r.key)}>{r.label}</button>
                    ))}
                </Group>
                <Group label="Rebalance">
                    {REBALS.map((r) => (
                        <button key={r.key} type="button" onClick={() => load(range, r.key, cost)} aria-pressed={rebal === r.key} className={pill(rebal === r.key)}>{r.label}</button>
                    ))}
                </Group>
                <Group label="Cost">
                    {COSTS.map((c) => (
                        <button key={c} type="button" onClick={() => load(range, rebal, c)} aria-pressed={cost === c} className={pill(cost === c)}>{c}bp</button>
                    ))}
                </Group>
                {pending && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={copyCsv} disabled={!bt} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-gray-100 disabled:opacity-50">
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}
                    </button>
                    <button type="button" onClick={exportCsv} disabled={!bt} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-gray-100 disabled:opacity-50">
                        <Download size={13} /> CSV
                    </button>
                </div>
            </div>

            <div className={cn(pending && 'pointer-events-none opacity-60 transition-opacity')}>
                {bt ? (
                    <BacktestSection bt={bt} />
                ) : (
                    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        Backtest unavailable for this combination.
                    </div>
                )}
            </div>
        </div>
    );
}

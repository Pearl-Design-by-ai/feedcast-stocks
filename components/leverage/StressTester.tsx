'use client';

/**
 * Owner-only stress tester. Grows $100k over a real window, then simulates a
 * shock scenario forward. Ships presets (historical-flavoured) and a full custom
 * form so the user can define their own shock. Runs through the server action
 * (engine POST) and memoizes each combination.
 */

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Play, SlidersHorizontal } from 'lucide-react';
import { getStressTest, type LevRange, type LevRebal, type StressScenarioInput } from '@/lib/actions/leverage.actions';
import type { StressReport } from '@/lib/leverage';
import { cn } from '@/lib/utils';
import { StressSection } from './LeverageUi';

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

type Preset = StressScenarioInput & { key: string; label: string; desc: string };

const PRESETS: Preset[] = [
    { key: 'correction', label: 'Correction −15%', desc: 'A routine 15% pullback over ~3 weeks, then a partial bounce.', dropPct: 15, dropDays: 15, recoverPct: 60, recoverDays: 40, vix: 26 },
    { key: 'bear2022', label: '2022-style bear −35%', desc: 'A slow grind down 35% over a year with no recovery in-window.', dropPct: 35, dropDays: 250, recoverPct: 0, recoverDays: 0, vix: 27 },
    { key: 'covid', label: 'COVID crash −34%', desc: '34% in ~5 weeks, then a sharp V-shaped recovery.', dropPct: 34, dropDays: 23, recoverPct: 100, recoverDays: 120, vix: 55 },
    { key: 'gfc', label: '2008 GFC −55%', desc: '55% drawdown over ~14 months, no recovery in-window.', dropPct: 55, dropDays: 350, recoverPct: 0, recoverDays: 0, vix: 45 },
    { key: 'flash', label: 'Flash crash −20%', desc: '20% in a handful of days, then a quick snapback.', dropPct: 20, dropDays: 5, recoverPct: 90, recoverDays: 30, vix: 60 },
];

const scenKey = (s: StressScenarioInput) => `${s.dropPct}/${s.dropDays}/${s.recoverPct}/${s.recoverDays}/${s.vix}`;
const cacheKey = (r: LevRange, rb: LevRebal, c: number, s: StressScenarioInput) => `${r}|${rb}|${c}|${scenKey(s)}`;

export default function StressTester() {
    const [range, setRange] = useState<LevRange>('1y');
    const [rebal, setRebal] = useState<LevRebal>('daily');
    const [cost] = useState(3);
    const [presetKey, setPresetKey] = useState('correction');
    const [custom, setCustom] = useState(false);
    const [form, setForm] = useState<StressScenarioInput>(PRESETS[0]);
    const [report, setReport] = useState<StressReport | null>(null);
    const [pending, startTransition] = useTransition();
    const cache = useRef<Record<string, StressReport | null>>({});

    function run(r: LevRange, rb: LevRebal, c: number, scenario: StressScenarioInput, label: string, desc: string) {
        const key = cacheKey(r, rb, c, scenario);
        const hit = cache.current[key];
        if (hit !== undefined) {
            setReport(hit);
            return;
        }
        startTransition(async () => {
            const res = await getStressTest(r, rb, c, { ...scenario, label, desc });
            cache.current[key] = res;
            setReport(res);
        });
    }

    // Run on mount and whenever the window/rebal change (re-using the active scenario).
    useEffect(() => {
        const active = custom ? form : PRESETS.find((p) => p.key === presetKey)!;
        const label = custom ? 'Custom scenario' : (active as Preset).label;
        const desc = custom ? '' : (active as Preset).desc;
        run(range, rebal, cost, active, label, desc);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, rebal]);

    function pickPreset(p: Preset) {
        setPresetKey(p.key);
        setCustom(false);
        setForm(p);
        run(range, rebal, cost, p, p.label, p.desc);
    }

    function runCustom() {
        run(range, rebal, cost, form, 'Custom scenario', '');
    }

    const pill = (active: boolean) =>
        cn('rounded-md px-2.5 py-1 text-xs font-semibold transition-colors', active ? 'bg-red-500/20 text-red-200 ring-1 ring-inset ring-red-400/40' : 'text-gray-400 hover:text-gray-200');
    const num = (label: string, key: keyof StressScenarioInput, min: number, max: number, suffix: string) => (
        <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/60 px-2 py-1">
                <input
                    type="number" min={min} max={max} value={form[key] as number}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-14 bg-transparent text-sm tabular-nums text-gray-100 outline-none"
                />
                <span className="text-[10px] text-gray-500">{suffix}</span>
            </div>
        </label>
    );

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-100">Stress test — $100k into a shock</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-400">
                    Grow $100k over a real window, then drop a shock on it. Pick a preset or define your own (decline, duration, bounce, VIX) and
                    see how the rotation&apos;s de-levering holds up versus plain 1x and naked 3x.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Run-up</span>
                    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-1">
                        {RANGES.map((r) => (
                            <button key={r.key} type="button" onClick={() => setRange(r.key)} aria-pressed={range === r.key} className={pill(range === r.key)}>{r.label}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Rebalance</span>
                    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-1">
                        {REBALS.map((r) => (
                            <button key={r.key} type="button" onClick={() => setRebal(r.key)} aria-pressed={rebal === r.key} className={pill(rebal === r.key)}>{r.label}</button>
                        ))}
                    </div>
                </div>
                {pending && <Loader2 className="h-4 w-4 animate-spin text-red-400" />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                    <button key={p.key} type="button" onClick={() => pickPreset(p)} aria-pressed={!custom && presetKey === p.key} className={pill(!custom && presetKey === p.key)}>{p.label}</button>
                ))}
                <button type="button" onClick={() => setCustom((c) => !c)} aria-pressed={custom} className={cn('inline-flex items-center gap-1', pill(custom))}>
                    <SlidersHorizontal size={12} /> Custom
                </button>
            </div>

            {custom && (
                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                    {num('Drop', 'dropPct', 1, 95, '%')}
                    {num('Over', 'dropDays', 1, 500, 'days')}
                    {num('Recover', 'recoverPct', 0, 200, '%')}
                    {num('Over', 'recoverDays', 0, 500, 'days')}
                    {num('VIX', 'vix', 10, 90, '')}
                    <button type="button" onClick={runCustom} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 ring-1 ring-inset ring-red-400/40 hover:bg-red-500/30">
                        <Play size={13} /> Run scenario
                    </button>
                </div>
            )}

            <div className={cn(pending && 'pointer-events-none opacity-60 transition-opacity')}>
                {report ? (
                    <StressSection report={report} />
                ) : (
                    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                        {pending ? 'Running the scenario…' : 'Pick a scenario to run the stress test.'}
                    </div>
                )}
            </div>
        </section>
    );
}

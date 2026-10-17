import { cn } from '@/lib/utils';
import { LineChart } from './charts';
import DrawdownChart from './DrawdownChart';
import { Card, CardTitle, EmptyState } from './ui';
import { depletionYear, trimAtDepletion } from '@/lib/private-portfolio/math';
import { fmtPct, fmtUsd, fmtUsdShort, variantLabel } from '@/lib/private-portfolio/format';
import type { Plan } from '@/lib/private-portfolio/types';

export default function ScenarioTab({ plan }: { plan: Plan }) {
    const projections = plan.projections ?? [];
    const dd = plan.drawdown;
    const ddKeys = dd ? Object.keys(dd.series) : [];
    const episodeRows = dd ? Object.entries(dd.episodes).flatMap(([k, eps]) => eps.map((e) => ({ variant: k, ...e }))) : [];
    const scenarios = plan.scenarios ?? [];
    const scenarioKeys = [...new Set(scenarios.flatMap((s) => Object.keys(s.lossUsd)))];

    if (!projections.length && !ddKeys.length && !scenarios.length) {
        return <EmptyState>Bu plan için projeksiyon veya senaryo verisi yok.</EmptyState>;
    }

    const years = [...new Set(projections.flatMap((p) => p.points.map((pt) => pt.year)))].sort((a, b) => a - b);
    const cspx = projections.find((p) => p.points.some((pt) => pt.cspxUsd != null));
    const projSeries = projections.map((p) => ({ name: p.policy, points: trimAtDepletion(p.points.map((pt) => ({ x: pt.year, y: pt.incomePortfolioUsd }))) }));
    if (cspx) {
        projSeries.push({
            name: 'CSPX karşılaştırma',
            points: trimAtDepletion(cspx.points.filter((pt) => pt.cspxUsd != null).map((pt) => ({ x: pt.year, y: pt.cspxUsd as number }))),
        });
    }
    const depletions = projections
        .map((p) => ({ policy: p.policy, year: depletionYear(p.points, p.depletionYear) }))
        .filter((d): d is { policy: string; year: number } => d.year !== null);

    return (
        <div className="flex flex-col gap-4">
            {projections.length > 0 && (
                <Card>
                    <CardTitle
                        aside={depletions.length ? depletions.map((d) => `${d.policy}: tükenme ${d.year}`).join(' · ') : 'Ufukta tükenme yok'}
                    >
                        Projeksiyon — gelir portföyü
                    </CardTitle>
                    <LineChart series={projSeries} />
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2 font-medium">Yıl</th>
                                    {projections.map((p) => (
                                        <th key={p.policy} className="px-2 py-2 text-right font-medium">
                                            {p.policy}
                                        </th>
                                    ))}
                                    {cspx && <th className="px-2 py-2 text-right font-medium">CSPX</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {years.map((y) => (
                                    <tr key={y} className="border-b border-gray-800/60">
                                        <td className="px-2 py-1.5 text-gray-300 tabular-nums">{y}</td>
                                        {projections.map((p) => {
                                            const pt = p.points.find((x) => x.year === y);
                                            const depleted = pt ? pt.incomePortfolioUsd <= 0 : false;
                                            return (
                                                <td key={p.policy} className={cn('px-2 py-1.5 text-right tabular-nums', depleted ? 'text-red-400' : 'text-gray-200')}>
                                                    {pt ? fmtUsdShort(Math.max(0, pt.incomePortfolioUsd)) : '—'}
                                                </td>
                                            );
                                        })}
                                        {cspx && (
                                            <td className="px-2 py-1.5 text-right text-gray-400 tabular-nums">
                                                {fmtUsdShort(cspx.points.find((x) => x.year === y)?.cspxUsd)}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {dd && ddKeys.length > 0 && (
                <Card>
                    <CardTitle
                        aside={Object.entries(dd.maxDdPct)
                            .map(([k, v]) => `${variantLabel(k)} maks. DD ${fmtPct(v)}`)
                            .join(' · ')}
                    >
                        Drawdown — kaldıraç varyantları
                    </CardTitle>
                    <DrawdownChart series={dd.series} />
                </Card>
            )}

            {episodeRows.length > 0 && (
                <Card>
                    <CardTitle>Drawdown dönemleri</CardTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2 font-medium">Varyant</th>
                                    <th className="px-2 py-2 font-medium">Zirve</th>
                                    <th className="px-2 py-2 font-medium">Dip</th>
                                    <th className="px-2 py-2 font-medium">Toparlanma</th>
                                    <th className="px-2 py-2 text-right font-medium">Derinlik</th>
                                    <th className="px-2 py-2 text-right font-medium">Düşüş (ay)</th>
                                    <th className="px-2 py-2 text-right font-medium">Toparlanma (ay)</th>
                                    <th className="px-2 py-2 text-right font-medium">Toplam (ay)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {episodeRows.map((e, i) => (
                                    <tr key={`${e.variant}-${e.peak}-${i}`} className="border-b border-gray-800/60">
                                        <td className="px-2 py-1.5 text-gray-300">{variantLabel(e.variant)}</td>
                                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-400 tabular-nums">{e.peak}</td>
                                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-400 tabular-nums">{e.trough}</td>
                                        <td className="whitespace-nowrap px-2 py-1.5 text-gray-400 tabular-nums">{e.recovery ?? 'Devam ediyor'}</td>
                                        <td className="px-2 py-1.5 text-right text-red-400 tabular-nums">{fmtPct(e.ddPct)}</td>
                                        <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{e.fallMonths}</td>
                                        <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{e.recoveryMonths ?? '—'}</td>
                                        <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{e.totalMonths ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {scenarios.length > 0 && (
                <Card>
                    <CardTitle>Senaryo kayıpları</CardTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2 font-medium">Senaryo</th>
                                    {scenarioKeys.map((k) => (
                                        <th key={k} className="px-2 py-2 text-right font-medium">
                                            {variantLabel(k)}
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 text-right font-medium">Toparlanma</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scenarios.map((s) => (
                                    <tr key={s.name} className="border-b border-gray-800/60 last:border-0">
                                        <td className="px-2 py-1.5 text-gray-300">{s.name}</td>
                                        {scenarioKeys.map((k) => (
                                            <td key={k} className="px-2 py-1.5 text-right text-red-400 tabular-nums">
                                                {k in s.lossUsd ? fmtUsd(s.lossUsd[k]) : '—'}
                                            </td>
                                        ))}
                                        <td className="px-2 py-1.5 text-right text-gray-400">{s.recovery}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

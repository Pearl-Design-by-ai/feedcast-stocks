import { GroupedBars } from './charts';
import { Card, CardTitle, Kpi, deltaTone } from './ui';
import { planIncomeUsd, planScope, scopeIncomeUsd, sum } from '@/lib/private-portfolio/math';
import { MONTHS_TR, fmtSignedUsd, fmtUsd, fmtUsdShort } from '@/lib/private-portfolio/format';
import type { Plan, Snapshot } from '@/lib/private-portfolio/types';

export default function IncomeTab({ snapshot, plan }: { snapshot: Snapshot | null; plan: Plan | null }) {
    const current = snapshot?.monthlyIncome ?? Array(12).fill(0);
    const planMonthly = plan?.monthlyIncome ?? null;
    // A plan with explicit scopeAccounts compares against those accounts only.
    // The synced monthly calendar is portfolio-wide, so it is labelled as such.
    const scope = snapshot && plan?.scopeAccounts?.length ? planScope(snapshot.accounts, plan) : null;
    const partial = !!scope && !scope.whole;
    const currentTotal = snapshot ? (scope ? scopeIncomeUsd(snapshot, scope) : snapshot.totals.annualIncomeUsd || sum(current)) : 0;
    const planTotal = plan ? (planMonthly ? sum(planMonthly) : planIncomeUsd(plan)) : null;
    const currentLabel = partial ? 'Mevcut (tüm hesaplar)' : 'Mevcut';

    const series = [{ name: currentLabel, values: current }];
    if (plan && planMonthly) series.push({ name: plan.title, values: planMonthly });

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Kpi
                    label="Mevcut yıllık gelir"
                    value={fmtUsdShort(currentTotal)}
                    sub={scope ? `Kapsam: ${scope.accounts.map((a) => a.name).join(', ') || 'eşleşen hesap yok'}` : `Aylık ort. ${fmtUsdShort(currentTotal / 12)}`}
                />
                {planTotal != null && (
                    <Kpi label="Plan yıllık gelir" value={fmtUsdShort(planTotal)} sub={`Aylık ort. ${fmtUsdShort(planTotal / 12)}`} />
                )}
                {planTotal != null && (
                    <Kpi label="Fark" value={fmtSignedUsd(planTotal - currentTotal)} tone={deltaTone(planTotal - currentTotal)} sub="Plan − mevcut" />
                )}
            </div>

            <Card>
                <CardTitle
                    aside={[partial && 'Mevcut takvim tüm hesapları kapsıyor', plan && !planMonthly && 'Planın aylık dağılımı yok'].filter(Boolean).join(' · ') || undefined}
                >
                    Aylık gelir takvimi
                </CardTitle>
                <GroupedBars labels={MONTHS_TR} series={series} />
            </Card>

            <Card>
                <CardTitle>Aylık tablo</CardTitle>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                                <th className="px-2 py-2 font-medium">Ay</th>
                                <th className="px-2 py-2 text-right font-medium">{currentLabel}</th>
                                {planMonthly && <th className="px-2 py-2 text-right font-medium">Plan</th>}
                                {planMonthly && <th className="px-2 py-2 text-right font-medium">Fark</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {MONTHS_TR.map((m, i) => (
                                <tr key={m} className="border-b border-gray-800/60">
                                    <td className="px-2 py-1.5 text-gray-300">{m}</td>
                                    <td className="px-2 py-1.5 text-right text-gray-200 tabular-nums">{fmtUsd(current[i])}</td>
                                    {planMonthly && <td className="px-2 py-1.5 text-right text-gray-200 tabular-nums">{fmtUsd(planMonthly[i])}</td>}
                                    {planMonthly && <td className="px-2 py-1.5 text-right text-gray-400 tabular-nums">{fmtSignedUsd(planMonthly[i] - current[i])}</td>}
                                </tr>
                            ))}
                            <tr className="font-semibold">
                                <td className="px-2 py-2 text-gray-300">Toplam</td>
                                <td className="px-2 py-2 text-right text-gray-100 tabular-nums">{fmtUsd(sum(current))}</td>
                                {planMonthly && <td className="px-2 py-2 text-right text-gray-100 tabular-nums">{fmtUsd(sum(planMonthly))}</td>}
                                {planMonthly && <td className="px-2 py-2 text-right text-gray-300 tabular-nums">{fmtSignedUsd(sum(planMonthly) - sum(current))}</td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

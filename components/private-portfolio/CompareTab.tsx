import { cn } from '@/lib/utils';
import { BulletList, Card, CardTitle, Kpi, deltaTone } from './ui';
import {
    allHoldings,
    allocationByCustodian,
    allocationByGroup,
    compareSlices,
    diffTotals,
    groupDiff,
    netCashNeedUsd,
    planIncomeUsd,
    planScope,
    scopeIncomeUsd,
    sum,
    type Slice,
} from '@/lib/private-portfolio/math';
import { fmtDate, fmtNum, fmtPct, fmtShare, fmtSignedUsd, fmtUsd, fmtUsdShort } from '@/lib/private-portfolio/format';
import type { DiffAction, Plan, Snapshot } from '@/lib/private-portfolio/types';

const ACTION_LABEL: Record<DiffAction, string> = { sell: 'Sat', buy: 'Al', keep: 'Tut', transfer: 'Transfer' };
const ACTION_TONE: Record<DiffAction, string> = {
    sell: 'text-red-400 border-red-400/40 bg-red-400/10',
    buy: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    keep: 'text-gray-300 border-gray-600 bg-gray-800/60',
    transfer: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
};
const SCOPE_LABEL: Record<Plan['account'], string> = { personal: 'Kişisel hesaplar', company: 'Şirket hesabı', both: 'Tüm hesaplar' };

function SideBySide({ title, current, target }: { title: string; current: Slice[]; target: Slice[] }) {
    const rows = compareSlices(current, target).filter((r) => r.current || r.target);
    return (
        <Card>
            <CardTitle>{title}</CardTitle>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                            <th className="px-2 py-2 font-medium" />
                            <th className="px-2 py-2 text-right font-medium">Mevcut</th>
                            <th className="px-2 py-2 text-right font-medium">Hedef</th>
                            <th className="px-2 py-2 text-right font-medium">Fark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.key} className="border-b border-gray-800/60 last:border-0">
                                <td className="px-2 py-2 text-gray-300">{r.key}</td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                    <div className="text-gray-200">{fmtUsdShort(r.current)}</div>
                                    <div className="text-[11px] text-gray-500">{fmtShare(r.currentShare)}</div>
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                    <div className="text-gray-200">{fmtUsdShort(r.target)}</div>
                                    <div className="text-[11px] text-gray-500">{fmtShare(r.targetShare)}</div>
                                </td>
                                <td className={cn('px-2 py-2 text-right tabular-nums', r.delta > 0 ? 'text-emerald-400' : r.delta < 0 ? 'text-red-400' : 'text-gray-500')}>
                                    {fmtSignedUsd(r.delta)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

export default function CompareTab({ snapshot, plan }: { snapshot: Snapshot | null; plan: Plan }) {
    const scope = snapshot ? planScope(snapshot.accounts, plan) : null;
    const current = allHoldings(scope?.accounts ?? []);
    const currentIncome = snapshot && scope ? scopeIncomeUsd(snapshot, scope) : 0;
    const netCash = netCashNeedUsd(plan, snapshot ? current : null);
    const targetIncome = planIncomeUsd(plan);
    const fees = typeof plan.summary.feesUsd === 'number' ? plan.summary.feesUsd : null;
    const currentFees = typeof plan.summary.currentFeesUsd === 'number' ? plan.summary.currentFeesUsd : null;
    const groups = groupDiff(plan.diff);
    const totals = diffTotals(plan.diff);
    const target = plan.summary.targetIncomeUsd;

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">{plan.title}</h2>
                        {plan.subtitle && <p className="text-sm text-gray-400">{plan.subtitle}</p>}
                    </div>
                    <div className="text-xs text-gray-500 sm:text-right">
                        <p>
                            {scope?.explicit ? 'Plan kapsamı' : SCOPE_LABEL[plan.account]} · {fmtDate(plan.asOf)}
                        </p>
                        {scope && (
                            <p className={cn('mt-0.5', scope.accounts.length ? 'text-gray-400' : 'text-amber-400')}>
                                Kapsam: {scope.accounts.length ? scope.accounts.map((a) => a.name).join(', ') : `eşleşen hesap yok (${plan.scopeAccounts?.join(', ')})`}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi
                    label="Yıllık gelir (plan)"
                    value={fmtUsdShort(targetIncome)}
                    sub={
                        <>
                            Mevcut {fmtUsdShort(currentIncome)} ·{' '}
                            <span className={deltaTone(targetIncome - currentIncome) === 'down' ? 'text-red-400' : 'text-emerald-400'}>
                                {fmtSignedUsd(targetIncome - currentIncome)}
                            </span>
                        </>
                    }
                />
                <Kpi
                    label="Yıllık ücret"
                    value={fmtUsdShort(fees)}
                    sub={
                        fees != null && currentFees != null ? (
                            <>
                                Mevcut {fmtUsdShort(currentFees)} ·{' '}
                                <span className={fees <= currentFees ? 'text-emerald-400' : 'text-red-400'}>{fmtSignedUsd(fees - currentFees)}</span>
                            </>
                        ) : undefined
                    }
                />
                <Kpi label="Beklenen getiri" value={fmtPct(plan.summary.expectedReturnPct)} sub={typeof plan.summary.durationYrs === 'number' ? `Süre ${plan.summary.durationYrs.toFixed(1)} yıl` : undefined} />
                <Kpi
                    label="Net nakit ihtiyacı"
                    value={fmtSignedUsd(netCash)}
                    sub={
                        snapshot && plan.targetHoldings.length
                            ? `Hedef ${fmtUsdShort(sum(plan.targetHoldings.map((h) => h.valueUsd)))} − mevcut ${fmtUsdShort(sum(current.map((h) => h.valueUsd)))}`
                            : target
                              ? `Hedef gelir ${fmtUsdShort(target[0])}–${fmtUsdShort(target[1])}`
                              : 'Alış − satış'
                    }
                />
            </div>

            {!snapshot && <p className="text-xs text-gray-500">Mevcut portföy henüz senkronize edilmedi — karşılaştırma yalnızca hedefi gösteriyor.</p>}
            {scope && !scope.whole && <p className="text-xs text-gray-500">Mevcut sütunu yalnızca planın kapsamındaki hesapları içeriyor.</p>}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <SideBySide title="Gruba göre" current={allocationByGroup(current)} target={allocationByGroup(plan.targetHoldings)} />
                <SideBySide title="Saklamacıya göre" current={allocationByCustodian(current)} target={allocationByCustodian(plan.targetHoldings)} />
            </div>

            <Card>
                <CardTitle aside={`Satış ${fmtUsdShort(totals.sell)} · Alış ${fmtUsdShort(totals.buy)} · Tut ${fmtUsdShort(totals.keep)}`}>
                    Alım / satım farkı
                </CardTitle>
                {groups.length === 0 ? (
                    <p className="text-sm text-gray-500">Bu planda işlem listesi yok.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-left text-[11px] uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2 font-medium">İşlem</th>
                                    <th className="px-2 py-2 font-medium">Varlık</th>
                                    <th className="px-2 py-2 font-medium">Saklamacı</th>
                                    <th className="px-2 py-2 text-right font-medium">Nominal</th>
                                    <th className="px-2 py-2 text-right font-medium">Tutar (USD)</th>
                                </tr>
                            </thead>
                            {groups.map((g) => (
                                <tbody key={g.action}>
                                    {g.rows.map((r, i) => (
                                        <tr key={`${r.name}-${i}`} className="border-b border-gray-800/60">
                                            <td className="px-2 py-2">
                                                <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', ACTION_TONE[r.action])}>{ACTION_LABEL[r.action]}</span>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="text-gray-200">{r.name}</div>
                                                {(r.ticker || r.isin || r.note) && (
                                                    <div className="text-[11px] text-gray-500">{[r.ticker, r.isin, r.note].filter(Boolean).join(' · ')}</div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-gray-400">{r.custodian}</td>
                                            <td className="px-2 py-2 text-right text-gray-400 tabular-nums">{fmtNum(r.nominal)}</td>
                                            <td className="px-2 py-2 text-right text-gray-100 tabular-nums">{fmtUsd(r.amountUsd)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-b border-gray-700 bg-gray-800/30">
                                        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-gray-400">
                                            {ACTION_LABEL[g.action]} toplamı · {g.rows.length} kalem
                                        </td>
                                        <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-200 tabular-nums">{fmtUsd(g.totalUsd)}</td>
                                    </tr>
                                </tbody>
                            ))}
                        </table>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <BulletList title="Adımlar" items={plan.steps} />
                <BulletList title="Riskler" items={plan.risks} />
                <BulletList title="Varsayımlar" items={plan.assumptions} />
            </div>
        </div>
    );
}

import Collapsible from '@/components/common/Collapsible';
import HoldingsTable from './HoldingsTable';
import { AllocationBar } from './charts';
import { Card, CardTitle, Kpi } from './ui';
import { allHoldings, allocationByCustodian, cashUsd, snapshotAllocation } from '@/lib/private-portfolio/math';
import { fmtDateTime, fmtShare, fmtUsd, fmtUsdShort } from '@/lib/private-portfolio/format';
import type { Snapshot } from '@/lib/private-portfolio/types';

export default function OverviewTab({ snapshot }: { snapshot: Snapshot }) {
    const holdings = allHoldings(snapshot.accounts);
    const t = snapshot.totals;
    const cash = cashUsd(holdings);
    const yieldOnMarket = t.marketUsd > 0 ? t.annualIncomeUsd / t.marketUsd : 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Toplam piyasa değeri" value={fmtUsdShort(t.marketUsd)} sub={fmtUsd(t.marketUsd)} />
                <Kpi label="Vadede değer" value={fmtUsdShort(t.maturityUsd)} sub={t.accruedUsd != null ? `İşlemiş faiz ${fmtUsdShort(t.accruedUsd)}` : undefined} />
                <Kpi label="Yıllık kupon / gelir" value={fmtUsdShort(t.annualIncomeUsd)} sub={`Piyasa değerine göre ${fmtShare(yieldOnMarket)}`} />
                <Kpi label="Nakit" value={fmtUsdShort(cash)} sub={t.marketUsd > 0 ? `Portföyün ${fmtShare(cash / t.marketUsd)}` : undefined} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardTitle>Varlık dağılımı</CardTitle>
                    <AllocationBar slices={snapshotAllocation(snapshot)} />
                </Card>
                <Card>
                    <CardTitle>Saklamacıya göre</CardTitle>
                    <AllocationBar slices={allocationByCustodian(holdings)} />
                </Card>
            </div>

            <div className="flex flex-col gap-3">
                {snapshot.accounts.map((a) => (
                    <Collapsible
                        key={a.id}
                        className="rounded-xl border border-gray-800 bg-gray-900/40"
                        header={
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h3 className="text-base font-semibold text-gray-100">{a.name}</h3>
                                <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-400">{a.custodian}</span>
                                <span className="text-sm text-gray-200 tabular-nums">{fmtUsd(a.totalUsd)}</span>
                                <span className="text-xs text-gray-500">{a.holdings.length} pozisyon</span>
                            </div>
                        }
                    >
                        <HoldingsTable holdings={a.holdings} totalUsd={a.totalUsd} />
                    </Collapsible>
                ))}
            </div>

            <p className="text-xs text-gray-500">
                Son senkron: <span className="text-gray-300 tabular-nums">{fmtDateTime(snapshot.asOf)}</span>
                {' · '}Excel: <span className="tabular-nums">{fmtDateTime(snapshot.sources.excelModified)}</span>
                {' · '}IBKR: <span className="tabular-nums">{fmtDateTime(snapshot.sources.ibkrAsOf)}</span>
                {snapshot.sources.pricesNote && <> · {snapshot.sources.pricesNote}</>}
                {Object.keys(snapshot.fx).length > 0 && (
                    <>
                        {' · '}Kurlar:{' '}
                        <span className="tabular-nums">
                            {Object.entries(snapshot.fx)
                                .map(([k, v]) => `${k} ${v.toFixed(4)}`)
                                .join(' · ')}
                        </span>
                    </>
                )}
            </p>
            {snapshot.notes?.length ? (
                <ul className="list-disc pl-5 text-xs text-gray-500">
                    {snapshot.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

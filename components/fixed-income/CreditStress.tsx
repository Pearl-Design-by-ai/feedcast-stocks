import { getReturns } from '@/lib/actions/returns.actions';

/**
 * Credit-stress read derived from real ETF performance (no paid spread feed
 * needed): when high yield lags investment grade, or EM lags Treasuries,
 * credit risk is being repriced. Honest proxy for OAS direction.
 */
export default async function CreditStress() {
    const data = await getReturns(['HYG', 'LQD', 'EMB', 'IEF']);
    const m3 = (sym: string) => data.find((d) => d.symbol === sym)?.m3 ?? null;

    const hy = m3('HYG');
    const ig = m3('LQD');
    const em = m3('EMB');
    const ust = m3('IEF');

    const hyVsIg = hy != null && ig != null ? hy - ig : null;
    const emVsUst = em != null && ust != null ? em - ust : null;

    if (hyVsIg == null && emVsUst == null) return null;

    const card = (
        label: string,
        spread: number | null,
        good: string,
        bad: string
    ) => {
        // Positive spread = riskier credit outperforming = risk-on / spreads tight.
        const tone = spread == null ? 'neutral' : spread >= 0 ? 'pos' : 'neg';
        const cls = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-gray-300';
        return (
            <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
                <span className={`text-xl font-semibold tabular-nums ${cls}`}>
                    {spread == null ? '—' : `${spread > 0 ? '+' : ''}${spread.toFixed(1)}%`}
                </span>
                <span className="text-xs leading-relaxed text-gray-400">{spread != null && spread >= 0 ? good : bad}</span>
            </div>
        );
    };

    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h2 className="text-base font-semibold text-gray-100">Credit stress check</h2>
            <p className="mb-4 mt-0.5 text-xs text-gray-500">
                3-month relative performance — riskier credit lagging safer credit is how spread
                widening (stress) shows up in prices.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {card(
                    'High yield vs investment grade',
                    hyVsIg,
                    'HY is keeping pace or leading IG — credit conditions are calm, spreads tight.',
                    'HY is lagging IG — credit spreads are widening; risk is being repriced.'
                )}
                {card(
                    'EM sovereign vs US Treasuries',
                    emVsUst,
                    'EM debt is outperforming Treasuries — risk appetite for EM is healthy.',
                    'EM is lagging Treasuries — investors are favoring safety over EM carry.'
                )}
            </div>
        </section>
    );
}

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { getNewsImpact } from '@/lib/actions/deepseek.actions';

const IMPACT_STYLE: Record<string, { cls: string; Icon: typeof ArrowUpRight }> = {
    positive: { cls: 'bg-green-500/15 text-green-400', Icon: ArrowUpRight },
    negative: { cls: 'bg-red-500/15 text-red-400', Icon: ArrowDownRight },
    neutral: { cls: 'bg-gray-700/60 text-gray-400', Icon: Minus },
};

/** AI-tagged news impact across the user's watchlist (streamed; omitted if empty). */
export default async function NewsImpact({ symbols }: { symbols: string[] }) {
    if (!symbols.length) return null;
    const items = await getNewsImpact(symbols);
    if (!items?.length) return null;

    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-100">News Impact on Your Stocks</h2>
            <ul className="flex flex-col divide-y divide-gray-800/70">
                {items.map((it, i) => {
                    const style = IMPACT_STYLE[it.impact] ?? IMPACT_STYLE.neutral;
                    const Icon = style.Icon;
                    return (
                        <li key={i} className="flex items-start gap-3 py-3">
                            <span
                                className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.cls}`}
                            >
                                <Icon className="h-3 w-3" />
                                {it.symbol}
                            </span>
                            <span className="text-sm leading-relaxed text-gray-300">{it.headline}</span>
                        </li>
                    );
                })}
            </ul>
            <p className="mt-3 text-[11px] text-gray-600">
                AI-tagged likely direction per headline — informational only, not advice.
            </p>
        </section>
    );
}

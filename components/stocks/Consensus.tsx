import { Gauge } from 'lucide-react';
import { getConsensus } from '@/lib/actions/deepseek.actions';

/**
 * Cycle-aware fundamental "Consensus" read on the stock — a disciplined
 * analyst framework (current position → thesis → key risk → cycle/valuation →
 * judgment). Streamed via Suspense; renders nothing when the engine is
 * unavailable. The framework + grounding live in the private markets-engine.
 */
export default async function Consensus({ symbol, name }: { symbol: string; name: string }) {
    const consensus = await getConsensus(symbol, name);
    if (!consensus || consensus.sections.length === 0) return null;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-gray-100">Consensus</h3>
                <span className="text-xs text-gray-500">DeepSeek</span>
            </div>
            <div className="flex flex-col gap-3">
                {consensus.sections.map((s, i) => (
                    <div key={i}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-300/80">
                            {i + 1}. {s.title}
                        </p>
                        <p className="text-sm leading-relaxed text-gray-300">{s.body}</p>
                    </div>
                ))}
            </div>
            <p className="mt-3 text-[11px] text-gray-600">
                Educational analysis only — not financial advice.
            </p>
        </div>
    );
}

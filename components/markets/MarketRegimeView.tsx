import { Sparkles } from 'lucide-react';
import { getMarketRegime, type SignalState } from '@/lib/actions/regime.actions';

const VERDICT_COLOR: Record<string, string> = {
    'Risk-On': '#22c55e',
    Neutral: '#FDD458',
    'Risk-Off': '#FF8243',
    Stress: '#FF495B',
};

function stateChip(state: SignalState) {
    if (state === 'on') return 'bg-green-500/15 text-green-400';
    if (state === 'off') return 'bg-red-500/15 text-red-400';
    return 'bg-gray-700/60 text-gray-400';
}
const STATE_LABEL: Record<SignalState, string> = { on: 'Risk-On', neutral: 'Neutral', off: 'Risk-Off' };

export default async function MarketRegimeView() {
    const regime = await getMarketRegime();

    if (!regime) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
                Market-regime data is unavailable right now — please check back shortly.
            </div>
        );
    }

    const color = VERDICT_COLOR[regime.verdict] ?? '#FDD458';

    return (
        <div className="flex flex-col gap-5">
            {/* Verdict + score */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-gray-500">Current regime</span>
                        <span className="text-3xl font-bold" style={{ color }}>
                            {regime.verdict}
                        </span>
                    </div>
                    <span className="text-sm text-gray-500">end-of-day · as of {regime.asOf}</span>
                </div>

                <div
                    className="relative mt-5 h-2.5 w-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#FF495B,#FF8243,#FDD458,#0FEDBE,#22c55e)' }}
                >
                    <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-950 bg-white shadow"
                        style={{ left: `${Math.min(100, Math.max(0, regime.score))}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-gray-500">
                    <span>Risk-Off</span>
                    <span>Risk-On</span>
                </div>

                {regime.narrative && (
                    <div className="mt-4 flex gap-2 rounded-lg bg-gray-800/50 p-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                        <p className="text-sm leading-relaxed text-gray-300">{regime.narrative}</p>
                    </div>
                )}
            </div>

            {/* Signals */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-100">Contributing Signals</h3>
                <ul className="flex flex-col divide-y divide-gray-800/70">
                    {regime.signals.map((s) => (
                        <li key={s.label} className="flex items-center justify-between gap-3 py-3">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-200">{s.label}</span>
                                <span className="text-xs text-gray-500">{s.detail}</span>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${stateChip(s.state)}`}>
                                {STATE_LABEL[s.state]}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-[11px] text-gray-600">
                    Signals computed from end-of-day prices &amp; the Crypto Fear &amp; Greed index.
                    Educational only — not investment advice.
                </p>
            </div>
        </div>
    );
}

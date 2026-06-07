'use client';

import { useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ADVANCED_CHART_WIDGET_CONFIG } from '@/lib/constants';

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
const DEFAULT_INPUT = 'AAPL, MSFT, NVDA, SPY';

function parseSymbols(raw: string): string[] {
    return Array.from(
        new Set(
            raw
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean)
        )
    ).slice(0, 6);
}

/**
 * Compare tool: overlay 2–6 symbols on one chart (percentage scale). The first
 * symbol is the base; the rest are added as comparisons.
 */
export default function Compare() {
    const [input, setInput] = useState(DEFAULT_INPUT);
    const [symbols, setSymbols] = useState<string[]>(parseSymbols(DEFAULT_INPUT));

    const base = symbols[0];
    const compareSymbols = symbols.slice(1).map((symbol) => ({ symbol, position: 'SameScale' }));

    function apply() {
        const parsed = parseSymbols(input);
        if (parsed.length) setSymbols(parsed);
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    apply();
                }}
                className="flex flex-col gap-2 sm:flex-row"
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Symbols, comma-separated — e.g. AAPL, MSFT, SPY"
                    aria-label="Symbols to compare"
                    className="h-11 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:outline-none"
                />
                <button
                    type="submit"
                    className="h-11 rounded-lg bg-teal-500 px-5 text-sm font-semibold text-gray-900 transition-colors hover:bg-teal-400"
                >
                    Compare
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                {symbols.map((s, i) => (
                    <span
                        key={s}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${i === 0 ? 'bg-teal-500/15 text-teal-300' : 'bg-gray-800 text-gray-400'}`}
                    >
                        {s}
                        {i === 0 && <span className="ml-1 text-[10px] text-teal-500/70">base</span>}
                    </span>
                ))}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                {base && (
                    <TradingViewWidget
                        key={symbols.join(',')}
                        scriptUrl={SCRIPT}
                        config={ADVANCED_CHART_WIDGET_CONFIG(base, [], 'D', compareSymbols)}
                        height={560}
                        allowExpand
                    />
                )}
            </div>
        </div>
    );
}

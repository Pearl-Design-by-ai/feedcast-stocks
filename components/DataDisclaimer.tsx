import { Info } from "lucide-react";

/**
 * Delayed-data disclaimer. Finnhub's free tier and the embedded TradingView
 * widgets serve delayed quotes (typically ~15 minutes), so we surface that
 * clearly anywhere live-looking numbers are shown.
 */
export default function DataDisclaimer({ className = "" }: { className?: string }) {
    return (
        <div
            role="note"
            className={`flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-200/80 ${className}`}
        >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400/80" aria-hidden="true" />
            <span>
                Prices are <strong>delayed by ~15 minutes</strong> and shown for
                informational purposes only — not real-time, and not investment advice.
            </span>
        </div>
    );
}

import { Info } from "lucide-react";

/**
 * Delayed-data disclaimer. Finnhub's free tier and the embedded TradingView
 * widgets serve delayed quotes (typically ~15 minutes), so we surface that
 * clearly anywhere live-looking numbers are shown.
 *
 * Color is driven by the theme-aware `--warn` var — amber on dark, red on
 * light (amber washes out on a light background).
 */
export default function DataDisclaimer({ className = "" }: { className?: string }) {
    return (
        <div
            role="note"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${className}`}
            style={{
                color: 'var(--warn)',
                borderColor: 'color-mix(in srgb, var(--warn) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--warn) 8%, transparent)',
            }}
        >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--warn)' }} aria-hidden="true" />
            <span>
                Prices are <strong>delayed</strong> and shown for
                informational purposes only — not real-time, and not investment advice.
            </span>
        </div>
    );
}

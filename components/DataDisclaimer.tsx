import { Info } from "lucide-react";

/**
 * Compact delayed-data note shown anywhere live-looking numbers appear. The
 * full legal text lives once in <DisclaimerFooter/> at the bottom of the page;
 * this just flags the essentials and anchors to it (#disclaimer).
 *
 * Color is driven by the theme-aware `--warn` var — amber on dark, red on
 * light (amber washes out on a light background).
 */
export default function DataDisclaimer({ className = "" }: { className?: string }) {
    return (
        <div
            role="note"
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${className}`}
            style={{
                color: 'var(--warn)',
                borderColor: 'color-mix(in srgb, var(--warn) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--warn) 8%, transparent)',
            }}
        >
            <Info className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--warn)' }} aria-hidden="true" />
            <span>
                Prices <strong>delayed</strong> · informational only, not investment advice.{" "}
                <a href="#disclaimer" className="underline underline-offset-2 hover:opacity-80">
                    Full disclaimer
                </a>
            </span>
        </div>
    );
}

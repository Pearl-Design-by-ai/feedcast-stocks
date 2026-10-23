/**
 * Suspense placeholder for a streamed stock-page card. Same card grammar
 * (`rounded-xl` + `bg-gray-900/…`) as the real panels, so it sits in the
 * layout at roughly the final size and the living-terminal rise applies.
 * The pulse is motion-safe only.
 */
export default function CardSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={`rounded-xl border border-gray-800 bg-gray-900/40 p-4 ${className}`}
        >
            <div className="mb-4 h-3.5 w-28 rounded bg-gray-800 motion-safe:animate-pulse" />
            <div className="flex flex-col gap-2.5">
                {Array.from({ length: lines }, (_, i) => (
                    <div
                        key={i}
                        className="h-3 rounded bg-gray-800/70 motion-safe:animate-pulse"
                        style={{ width: `${92 - ((i * 17) % 35)}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

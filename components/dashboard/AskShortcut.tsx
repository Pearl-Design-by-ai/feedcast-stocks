import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

/** Compact dashboard tile linking into the grounded AI chat. */
export default function AskShortcut() {
  return (
    <Link
      href="/ask"
      className="group block h-full rounded-xl border border-gray-800 bg-gray-900/40 p-5 transition-colors hover:border-teal-500/40"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-400">
        <Sparkles className="h-3.5 w-3.5" /> Ask the Markets
      </div>
      <p className="text-sm leading-relaxed text-gray-300">
        Grounded AI answers using the live market regime, key levels and today’s headlines.
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-300">
        Open chat
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

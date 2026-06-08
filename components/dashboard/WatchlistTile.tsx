import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';

type Row = { symbol: string; company: string };

/** Compact watchlist summary tile — symbols at a glance, link to the full page. */
export default async function WatchlistTile({ userId }: { userId: string }) {
  let rows: Row[] = [];
  try {
    rows = (((await getUserWatchlist(userId)) as Row[]) ?? []).filter((r) => r?.symbol);
  } catch {
    rows = [];
  }

  return (
    <div className="h-full rounded-xl border border-gray-800 bg-gray-900/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Star className="h-3.5 w-3.5 text-teal-400" /> Watchlist
        </span>
        <Link
          href="/watchlist"
          className="inline-flex items-center gap-1 text-xs text-teal-300 hover:underline"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tickers yet.{' '}
          <Link href="/search" className="text-teal-300 hover:underline">
            Add some →
          </Link>
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {rows.slice(0, 14).map((r) => (
            <li key={r.symbol}>
              <Link
                href={`/stocks/${r.symbol}`}
                title={r.company}
                className="inline-flex items-center rounded-full bg-gray-800/60 px-3 py-1.5 text-sm font-semibold text-gray-200 transition-colors hover:text-teal-200"
              >
                {r.symbol}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getReportQuotes } from '@/lib/reports-data';
import { cn } from '@/lib/utils';

type Row = { symbol: string; company: string };

const MAX_ROWS = 14;

function fmtPrice(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * Compact watchlist summary tile — each symbol with its live price and day
 * change (quotes via the bounded-concurrency pool so a large watchlist can't
 * burst the Finnhub rate limit), linking to the full page.
 */
export default async function WatchlistTile({ userId }: { userId: string }) {
  let rows: Row[] = [];
  try {
    rows = (((await getUserWatchlist(userId)) as Row[]) ?? []).filter((r) => r?.symbol);
  } catch {
    rows = [];
  }

  const shown = rows.slice(0, MAX_ROWS);
  let quotes = new Map<string, { price: number; changePercent: number }>();
  try {
    quotes = await getReportQuotes(shown.map((r) => r.symbol));
  } catch {
    // Quotes are decoration here — the symbol list still renders without them.
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
      {shown.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tickers yet.{' '}
          <Link href="/search" className="text-teal-300 hover:underline">
            Add some →
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {shown.map((r) => {
            const quote = quotes.get(r.symbol);
            return (
              <li key={r.symbol}>
                <Link
                  href={`/stocks/${r.symbol}`}
                  title={r.company}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-800/60 px-3 py-2 transition-colors hover:bg-gray-800"
                >
                  <span className="truncate text-sm font-semibold text-gray-200">
                    {r.symbol}
                  </span>
                  {quote ? (
                    <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      <span className="text-sm text-gray-300">{fmtPrice(quote.price)}</span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          quote.changePercent > 0
                            ? 'text-emerald-400'
                            : quote.changePercent < 0
                              ? 'text-red-400'
                              : 'text-gray-500'
                        )}
                      >
                        {fmtPct(quote.changePercent)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > MAX_ROWS && (
        <p className="mt-2 text-right text-[11px] text-gray-600">
          +{rows.length - MAX_ROWS} more on the full watchlist
        </p>
      )}
    </div>
  );
}

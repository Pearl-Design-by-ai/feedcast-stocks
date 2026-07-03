'use client';

/**
 * Auto AI commentary shown at the top of each markets data page. Reads the
 * current route, asks the engine for a short, grounded commentary on that page's
 * topic (using the latest data), and renders it with a "not advice / may be
 * wrong" disclaimer. Rendered once in the (root) layout — it self-hides on any
 * route that isn't one of the known topic pages, and on error/empty.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { getCommentary } from '@/lib/actions/commentary.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';
import { currentSession } from '@/lib/valuation';
import { formatEodDate } from '@/lib/utils';

// Path segment → topic (must match the engine's TOPIC_LABELS keys).
const TOPIC_PATHS = new Set([
  'market-regime',
  'market-indicators',
  'sectors',
  'world-indices',
  'currency',
  'commodities',
  'fixed-income',
  'crypto',
  'economic-calendar',
  'calendar',
  'screener',
  'compare',
  'etfs',
  'stocks',
]);

function topicFromPath(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  return TOPIC_PATHS.has(seg) ? seg : null;
}

export default function AiCommentary({ topic: topicProp }: { topic?: string } = {}) {
  const pathname = usePathname();
  // An explicit topic (e.g. as a dashboard tile) wins over route detection,
  // which is what makes this usable on the home page where the path is "/".
  const topic = topicProp ?? topicFromPath(pathname || '');
  const [comment, setComment] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topic) {
      setComment(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setComment(null);
    setAsOf(null);
    getCommentary(topic)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setComment(res.comment);
          // The commentary is grounded in end-of-day market data, so stamp it
          // with the most recent *completed* trading session rather than "now" —
          // it makes clear the read is on the prior session's close, not live.
          setAsOf(currentSession());
        } else {
          setComment(null);
        }
      })
      .catch(() => {
        if (!cancelled) setComment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  if (!topic) return null;
  if (!loading && !comment) return null;

  // Borderless, flush-left block so the commentary lines up with the page title
  // and description rather than sitting indented inside a card.
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-400">
        <Sparkles className="h-3.5 w-3.5" /> FeedCast AI Commentary
      </div>
      {loading || !comment ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> Reading the latest data…
        </div>
      ) : (
        <>
          <div className="text-sm leading-relaxed text-gray-300">
            <MarkdownLite text={comment} />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            FeedCast AI{asOf && <> · based on end-of-day data through <span className="tabular-nums">{formatEodDate(asOf)}</span>&apos;s close</>}
          </p>
        </>
      )}
    </div>
  );
}

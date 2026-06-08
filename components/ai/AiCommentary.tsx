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
]);

function topicFromPath(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  return TOPIC_PATHS.has(seg) ? seg : null;
}

export default function AiCommentary() {
  const pathname = usePathname();
  const topic = topicFromPath(pathname || '');
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topic) {
      setComment(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setComment(null);
    getCommentary(topic)
      .then((res) => {
        if (!cancelled) setComment(res.ok ? res.comment : null);
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

  return (
    <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-400">
        <Sparkles className="h-3.5 w-3.5" /> AI Commentary
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
          <p className="mt-3 border-t border-gray-800 pt-2 text-[11px] text-gray-500">
            AI-generated from live data — informational only, not investment advice, and may be
            inaccurate.
          </p>
        </>
      )}
    </div>
  );
}

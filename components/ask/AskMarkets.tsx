'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, AArrowDown, AArrowUp } from 'lucide-react';
import { askMarkets, type ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';

// Preset-only chat: no free-text box. Every question maps to a data point the
// engine actually injects into the model's context (market regime + per-signal
// readings, the key-markets snapshot, and today's headlines), so answers stay
// grounded instead of drifting into ungrounded territory.
const QUESTION_GROUPS: { label: string; questions: string[] }[] = [
  {
    label: 'Market regime',
    questions: [
      "What's the market regime right now and why?",
      'Are conditions risk-on or risk-off today?',
      "What's the risk score and what's driving it?",
      'Which signals are bullish vs bearish right now?',
      'Is the regime fragile or firmly risk-on?',
    ],
  },
  {
    label: 'Trend & momentum',
    questions: [
      'Is the S&P 500 above its 200-day trend?',
      'Is the 50-day above the 200-day (golden/death cross)?',
      "What's the 3-month momentum signal saying?",
    ],
  },
  {
    label: 'Breadth & leadership',
    questions: [
      'Is market breadth confirming the trend?',
      'Is tech (Nasdaq) leading or lagging the S&P?',
      'Are small caps (Russell 2000) keeping up?',
      'Is leadership broad or narrow?',
    ],
  },
  {
    label: 'Credit & sentiment',
    questions: [
      'What are credit spreads (HY vs IG) signaling?',
      'Is the bond market confirming risk appetite?',
      "What's the Crypto Fear & Greed reading?",
    ],
  },
  {
    label: 'US indices',
    questions: [
      'How are the major US indices doing today?',
      "How's the S&P 500 doing this week?",
      "How's the Nasdaq performing?",
      'Are small caps outperforming large caps?',
    ],
  },
  {
    label: 'Global markets',
    questions: [
      'How are global markets (FTSE, Nikkei) trading?',
      "How's Europe (FTSE) doing?",
      "How's Asia (Nikkei) doing?",
    ],
  },
  {
    label: 'Commodities, dollar & crypto',
    questions: [
      "What's happening with oil and gold?",
      'Is oil rising or falling?',
      'Is gold catching a safe-haven bid?',
      'Is the US dollar strong or weak right now?',
      "How's Bitcoin trading?",
      'What are 10-year bond yields doing?',
    ],
  },
  {
    label: 'Headlines',
    questions: [
      'What should I watch this week?',
      "What are today's biggest market headlines?",
      "What's the biggest risk in the headlines right now?",
    ],
  },
  {
    label: 'Basics',
    questions: [
      'Explain the yield curve simply.',
      'What does "market breadth" mean?',
      "Golden cross vs death cross — what's the difference?",
      'What does risk-on vs risk-off mean?',
      'Why does the dollar matter for stocks?',
      'How do bond yields affect stocks?',
    ],
  },
];

// Reader-controlled text size for the conversation. Defaults to `base` (16px) —
// the old `sm` (14px) read too small. Persisted so the choice sticks.
const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl'] as const;
const DEFAULT_FONT_IDX = 1;
const FONT_KEY = 'fcm_ask_font';

export default function AskMarkets() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontIdx, setFontIdx] = useState(DEFAULT_FONT_IDX);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(FONT_KEY);
      if (v != null) {
        const n = parseInt(v, 10);
        if (n >= 0 && n < FONT_SIZES.length) setFontIdx(n);
      }
    } catch {
      /* localStorage blocked — keep default */
    }
  }, []);

  // Bring the latest exchange into view whenever a message is added or the
  // thinking indicator toggles, so tapping a question scrolls to the answer.
  useEffect(() => {
    if (messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const setFont = (i: number) => {
    const n = Math.max(0, Math.min(FONT_SIZES.length - 1, i));
    setFontIdx(n);
    try {
      localStorage.setItem(FONT_KEY, String(n));
    } catch {
      /* ignore */
    }
  };

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await askMarkets([...messages, { role: 'user', content: question }]);
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }]);
      } else {
        setError(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const fontClass = FONT_SIZES[fontIdx];

  return (
    // The whole experience lives inside one soft "chat box" — calm surface, low
    // contrast, rounded bubbles inside.
    <div className="overflow-hidden rounded-2xl border border-gray-800/70 bg-gray-900/30">
      {/* Box header: identity + text-size control */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Markets chat
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-1 hidden text-[11px] uppercase tracking-wide text-gray-500 sm:inline">
            Text size
          </span>
          <button
            type="button"
            onClick={() => setFont(fontIdx - 1)}
            disabled={fontIdx === 0}
            aria-label="Smaller text"
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800/70 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <AArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFont(fontIdx + 1)}
            disabled={fontIdx === FONT_SIZES.length - 1}
            aria-label="Larger text"
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800/70 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <AArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conversation thread — soft bubbles */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-3 px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? `max-w-[88%] rounded-2xl rounded-br-md bg-teal-500/10 px-4 py-2.5 ${fontClass} text-gray-100`
                    : `max-w-[88%] rounded-2xl rounded-bl-md bg-gray-800/50 px-4 py-2.5 ${fontClass} leading-relaxed text-gray-200`
                }
              >
                {m.role === 'assistant' && (
                  <span className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" /> AI
                  </span>
                )}
                {m.role === 'assistant' ? <MarkdownLite text={m.content} /> : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              Thinking…
            </div>
          )}
          {error && <p className="text-sm text-yellow-200/80">{error}</p>}
          <div ref={endRef} />
        </div>
      )}

      {/* Suggested questions — soft tappable bubbles, grouped */}
      <div className="space-y-4 border-t border-gray-800/60 px-4 py-4">
        <p className="text-xs text-gray-400">
          {messages.length > 0 ? 'Ask another question' : 'Pick a question to get started'}
        </p>
        {QUESTION_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.questions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="rounded-full bg-gray-800/50 px-3.5 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700/60 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="px-4 pb-3 text-[11px] text-gray-500">
        Answers use live market context &amp; headlines — informational only, not advice.
      </p>
    </div>
  );
}

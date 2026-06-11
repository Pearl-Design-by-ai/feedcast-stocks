'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, AArrowDown, AArrowUp, Dices, RotateCcw } from 'lucide-react';
import { askMarkets, type ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';

/**
 * Preset-only chat with a text-first question directory: every question is
 * visible at once (no cards, no chips, no reveal steps), grouped under plain
 * headings in two reading columns — like a well-set index page. Questions
 * are link-styled text, so clickability reads the way links always have.
 *
 * No free-text box by design: every question maps to a data point the engine
 * actually injects (market regime + per-signal readings, the key-markets
 * snapshot, and today's headlines), so answers stay grounded.
 */
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

const ALL_QUESTIONS = QUESTION_GROUPS.flatMap((g) => g.questions);

// A touch of personality while the engine works.
const THINKING_LINES = [
  'Reading the tape…',
  'Checking the regime…',
  'Scanning the headlines…',
  'Crunching the signals…',
];

// Reader-controlled text size for the conversation. Defaults to `base` (16px).
const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl'] as const;
const DEFAULT_FONT_IDX = 1;
const FONT_KEY = 'fcm_ask_font';

export default function AskMarkets() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontIdx, setFontIdx] = useState(DEFAULT_FONT_IDX);
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);
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
    setThinkingLine(THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)]);
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

  const surpriseMe = () => send(ALL_QUESTIONS[Math.floor(Math.random() * ALL_QUESTIONS.length)]);
  const reset = () => {
    setMessages([]);
    setError('');
  };

  const hasChat = messages.length > 0;
  const fontClass = FONT_SIZES[fontIdx];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800/70 bg-gray-900/30">
      {/* Header: identity + actions */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Markets chat
        </span>
        <div className="flex items-center gap-1">
          {hasChat && (
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="mr-2 flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-teal-300 hover:underline disabled:opacity-30"
            >
              <RotateCcw size={12} /> New chat
            </button>
          )}
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
      {hasChat && (
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
              {thinkingLine}
            </div>
          )}
          {error && <p className="text-sm text-yellow-200/80">{error}</p>}
          <div ref={endRef} />
        </div>
      )}

      {/* Question directory — all of it, text-first, two reading columns. */}
      <div className={hasChat ? 'border-t border-gray-800/60 px-5 py-5' : 'px-5 py-5'}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-gray-300">
            {hasChat ? 'Ask another question' : 'Tap any question — answers come from live data'}
          </p>
          <button
            type="button"
            onClick={surpriseMe}
            disabled={loading}
            className="group flex items-center gap-1.5 text-sm text-teal-400 transition-colors hover:text-teal-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices size={15} className="transition-transform group-hover:rotate-12" />
            Surprise me
          </button>
        </div>

        <div className="columns-1 gap-10 md:columns-2 [&>*]:break-inside-avoid">
          {QUESTION_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {group.label}
              </p>
              <ul>
                {group.questions.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => send(q)}
                      disabled={loading}
                      className="group flex w-full items-start gap-2 py-[5px] text-left text-[15px] leading-snug text-gray-300 transition-colors hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span
                        aria-hidden
                        className="mt-px text-gray-600 transition-colors group-hover:text-teal-400"
                      >
                        ›
                      </span>
                      <span className="decoration-teal-400/40 underline-offset-4 group-hover:underline">
                        {q}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="border-t border-gray-800/40 px-5 py-2.5 text-[11px] text-gray-500">
        Answers use live market context &amp; headlines — informational only, not advice.
      </p>
    </div>
  );
}

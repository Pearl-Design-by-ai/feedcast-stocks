'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AArrowDown,
  AArrowUp,
  Activity,
  TrendingUp,
  Network,
  Gauge,
  CandlestickChart,
  Globe,
  Coins,
  Newspaper,
  GraduationCap,
  Dices,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { askMarkets, type ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';
import { cn } from '@/lib/utils';

/**
 * Preset-only chat redesigned as a "topic deck": instead of a 36-question
 * wall of flat pills, the empty state shows three featured questions plus a
 * grid of topic cards; tapping a card reveals just that topic's questions as
 * clearly-pressable buttons. Once a conversation starts, the thread takes
 * the stage and the picker collapses into a compact quick-reply strip.
 *
 * Still no free-text box: every question maps to a data point the engine
 * actually injects (regime + signals, key-markets snapshot, headlines), so
 * answers stay grounded.
 */

interface Topic {
  label: string;
  icon: LucideIcon;
  /** Static Tailwind classes — one accent per topic so the deck reads fast. */
  text: string;
  chip: string;
  border: string;
  arrow: string;
  questions: string[];
}

const TOPICS: Topic[] = [
  {
    label: 'Market regime',
    icon: Activity,
    text: 'text-teal-400',
    chip: 'bg-teal-400/10',
    border: 'hover:border-teal-400/50',
    arrow: 'group-hover:text-teal-400',
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
    icon: TrendingUp,
    text: 'text-emerald-400',
    chip: 'bg-emerald-400/10',
    border: 'hover:border-emerald-400/50',
    arrow: 'group-hover:text-emerald-400',
    questions: [
      'Is the S&P 500 above its 200-day trend?',
      'Is the 50-day above the 200-day (golden/death cross)?',
      "What's the 3-month momentum signal saying?",
    ],
  },
  {
    label: 'Breadth & leadership',
    icon: Network,
    text: 'text-sky-400',
    chip: 'bg-sky-400/10',
    border: 'hover:border-sky-400/50',
    arrow: 'group-hover:text-sky-400',
    questions: [
      'Is market breadth confirming the trend?',
      'Is tech (Nasdaq) leading or lagging the S&P?',
      'Are small caps (Russell 2000) keeping up?',
      'Is leadership broad or narrow?',
    ],
  },
  {
    label: 'Credit & sentiment',
    icon: Gauge,
    text: 'text-amber-400',
    chip: 'bg-amber-400/10',
    border: 'hover:border-amber-400/50',
    arrow: 'group-hover:text-amber-400',
    questions: [
      'What are credit spreads (HY vs IG) signaling?',
      'Is the bond market confirming risk appetite?',
      "What's the Crypto Fear & Greed reading?",
    ],
  },
  {
    label: 'US indices',
    icon: CandlestickChart,
    text: 'text-violet-400',
    chip: 'bg-violet-400/10',
    border: 'hover:border-violet-400/50',
    arrow: 'group-hover:text-violet-400',
    questions: [
      'How are the major US indices doing today?',
      "How's the S&P 500 doing this week?",
      "How's the Nasdaq performing?",
      'Are small caps outperforming large caps?',
    ],
  },
  {
    label: 'Global markets',
    icon: Globe,
    text: 'text-cyan-400',
    chip: 'bg-cyan-400/10',
    border: 'hover:border-cyan-400/50',
    arrow: 'group-hover:text-cyan-400',
    questions: [
      'How are global markets (FTSE, Nikkei) trading?',
      "How's Europe (FTSE) doing?",
      "How's Asia (Nikkei) doing?",
    ],
  },
  {
    label: 'Commodities & crypto',
    icon: Coins,
    text: 'text-orange-400',
    chip: 'bg-orange-400/10',
    border: 'hover:border-orange-400/50',
    arrow: 'group-hover:text-orange-400',
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
    icon: Newspaper,
    text: 'text-rose-400',
    chip: 'bg-rose-400/10',
    border: 'hover:border-rose-400/50',
    arrow: 'group-hover:text-rose-400',
    questions: [
      'What should I watch this week?',
      "What are today's biggest market headlines?",
      "What's the biggest risk in the headlines right now?",
    ],
  },
  {
    label: 'Learn the basics',
    icon: GraduationCap,
    text: 'text-yellow-400',
    chip: 'bg-yellow-400/10',
    border: 'hover:border-yellow-400/50',
    arrow: 'group-hover:text-yellow-400',
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

// The three best conversation starters — big and obvious on the empty state.
const FEATURED = [
  "What's the market regime right now and why?",
  'What should I watch this week?',
  "What are today's biggest market headlines?",
];

const ALL_QUESTIONS = TOPICS.flatMap((t) => t.questions);

// A touch of personality while the engine works.
const THINKING_LINES = [
  'Reading the tape…',
  'Checking the regime…',
  'Scanning the headlines…',
  'Crunching the signals…',
  'Asking the charts…',
];

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl'] as const;
const DEFAULT_FONT_IDX = 1;
const FONT_KEY = 'fcm_ask_font';

export default function AskMarkets() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontIdx, setFontIdx] = useState(DEFAULT_FONT_IDX);
  const [openTopic, setOpenTopic] = useState<number | null>(null);
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
    setOpenTopic(null);
  };

  const hasChat = messages.length > 0;
  const fontClass = FONT_SIZES[fontIdx];
  const topic = openTopic != null ? TOPICS[openTopic] : null;
  const askedCount = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages]);

  /** One question, rendered as an unmistakable button. */
  const questionButton = (q: string, accent?: Topic) => (
    <button
      key={q}
      type="button"
      onClick={() => send(q)}
      disabled={loading}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3 text-left text-sm text-gray-200 transition-all',
        'hover:bg-gray-800 hover:text-gray-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40',
        accent?.border ?? 'hover:border-teal-400/50'
      )}
    >
      <span className="min-w-0">{q}</span>
      <ArrowRight
        size={15}
        className={cn(
          'shrink-0 text-gray-600 transition-all group-hover:translate-x-0.5',
          accent ? accent.arrow : 'group-hover:text-teal-400'
        )}
      />
    </button>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800/70 bg-gray-900/30">
      {/* Header: identity + actions */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Markets chat
          {askedCount > 0 && (
            <span className="ml-1 rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] tabular-nums text-gray-500">
              {askedCount} asked
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {hasChat && (
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="mr-1 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-gray-800/70 hover:text-gray-200 disabled:opacity-30"
            >
              <RotateCcw size={12} /> New chat
            </button>
          )}
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

      {/* Conversation thread */}
      {hasChat && (
        <div className="flex flex-col gap-3 px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? `max-w-[88%] rounded-2xl rounded-br-md bg-teal-500/10 px-4 py-2.5 ${fontClass} text-gray-100`
                    : `max-w-[88%] rounded-2xl rounded-bl-md border-l-2 border-teal-400/40 bg-gray-800/50 px-4 py-2.5 ${fontClass} leading-relaxed text-gray-200`
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

      {/* ----- Empty state: featured questions + topic deck ----- */}
      {!hasChat && (
        <div className="px-4 py-5">
          <p className="mb-3 text-sm font-medium text-gray-200">
            What do you want to know about today&apos;s market?
          </p>

          {/* Featured starters — big, obvious, one tap. */}
          <div className="mb-5 flex flex-col gap-2">
            {FEATURED.map((q) => questionButton(q))}
            <button
              type="button"
              onClick={surpriseMe}
              disabled={loading}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-gray-600 bg-transparent px-4 py-3 text-left text-sm text-gray-300 transition-all hover:border-teal-400/60 hover:bg-gray-800/40 hover:text-teal-200 active:scale-[0.99] disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Dices size={16} className="text-teal-400 transition-transform group-hover:rotate-12" />
                Surprise me — ask a random question
              </span>
              <ArrowRight size={15} className="text-gray-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Or browse by topic
          </p>

          {openTopic == null ? (
            // Topic deck — one colorful card per theme.
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TOPICS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setOpenTopic(i)}
                    className={cn(
                      'group flex flex-col items-start gap-2 rounded-xl border border-gray-700 bg-gray-800/40 p-3.5 text-left transition-all',
                      'hover:bg-gray-800/80 active:scale-[0.98]',
                      t.border
                    )}
                  >
                    <span className={cn('rounded-lg p-2', t.chip)}>
                      <Icon size={18} className={t.text} />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-gray-200 group-hover:text-gray-50">
                      {t.label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {t.questions.length} questions
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            // One topic open — its questions as a clean tappable list.
            <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  {topic && (
                    <span className={cn('rounded-md p-1.5', topic.chip)}>
                      <topic.icon size={14} className={topic.text} />
                    </span>
                  )}
                  {topic?.label}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenTopic(null)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800/70 hover:text-gray-200"
                >
                  <ChevronLeft size={13} /> All topics
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {topic?.questions.map((q) => questionButton(q, topic))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----- In-chat quick replies: compact topic strip + active topic's questions ----- */}
      {hasChat && (
        <div className="border-t border-gray-800/60 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">Ask another question</p>
            <button
              type="button"
              onClick={surpriseMe}
              disabled={loading}
              className="group flex items-center gap-1.5 rounded-full border border-dashed border-gray-600 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-teal-400/60 hover:text-teal-200 disabled:opacity-40"
            >
              <Dices size={13} className="text-teal-400 transition-transform group-hover:rotate-12" />
              Surprise me
            </button>
          </div>

          {/* Topic strip — horizontally scrollable on small screens. */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {TOPICS.map((t, i) => {
              const Icon = t.icon;
              const active = openTopic === i;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setOpenTopic(active ? null : i)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                    active
                      ? cn('border-transparent text-gray-50', t.chip)
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  )}
                >
                  <Icon size={13} className={active ? t.text : 'text-gray-500'} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {topic ? (
            <div className="flex flex-col gap-2 animate-in fade-in-0 duration-150">
              {topic.questions.map((q) => questionButton(q, topic))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">Pick a topic above to see its questions.</p>
          )}
        </div>
      )}

      <p className="border-t border-gray-800/40 px-4 py-2.5 text-[11px] text-gray-500">
        Answers use live market context &amp; headlines — informational only, not advice.
      </p>
    </div>
  );
}

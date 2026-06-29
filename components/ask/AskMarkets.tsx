'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AArrowDown,
  AArrowUp,
  Dices,
  RotateCcw,
  ArrowUp,
  ArrowRight,
  BookOpen,
  Activity,
  Newspaper,
  Coins,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { askMarkets, type ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';
import { cn } from '@/lib/utils';
import { useIsAuthed } from '@/components/AuthProvider';
import { SIGN_IN_URL } from '@/lib/constants';

/**
 * ChatGPT-style grounded markets chat. Free-text composer (the engine answers
 * any question against live regime + headlines context), plus a practical
 * prompt library so members can start from a ready-made question and keep
 * going. Empty state welcomes with featured starters; the composer is always
 * pinned at the bottom.
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

// Hand-picked starters for the welcome screen — one strong question per theme.
const FEATURED: { icon: LucideIcon; q: string }[] = [
  { icon: Activity, q: "What's the market regime right now and why?" },
  { icon: Newspaper, q: 'What should I watch this week?' },
  { icon: Coins, q: "What's happening with oil and gold?" },
  { icon: GraduationCap, q: 'Explain the yield curve simply.' },
];

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
  const [input, setInput] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

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

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // Public page, members-only action: bounce anonymous visitors to sign-in
  // before any starter/composer call hits the (gated) server action.
  const isAuthed = useIsAuthed();

  async function send(text: string) {
    if (!isAuthed) {
      window.location.href = SIGN_IN_URL;
      return;
    }
    const question = text.trim();
    if (!question || loading) return;
    setError('');
    setInput('');
    setLibraryOpen(false);
    requestAnimationFrame(autoGrow);
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const surpriseMe = () => send(ALL_QUESTIONS[Math.floor(Math.random() * ALL_QUESTIONS.length)]);
  const reset = () => {
    setMessages([]);
    setError('');
    setActiveTopic(null);
    setLibraryOpen(false);
  };

  const hasChat = messages.length > 0;
  const fontClass = FONT_SIZES[fontIdx];
  const activeGroup = QUESTION_GROUPS.find((g) => g.label === activeTopic);

  // Topic pills + the selected topic's questions — the "pick a ready-made one"
  // surface, reused on the welcome screen and in the in-chat prompt drawer.
  const promptBrowser = (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {QUESTION_GROUPS.map((g) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setActiveTopic((t) => (t === g.label ? null : g.label))}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              activeTopic === g.label
                ? 'border-teal-400/50 bg-teal-500/15 text-teal-300'
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      {activeGroup && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeGroup.questions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={loading}
              className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-left text-[13px] text-gray-300 transition-colors hover:border-teal-400/40 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-gray-800/70 bg-gray-900/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
          <Sparkles className="h-4 w-4 text-teal-400" /> Ask the Markets
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

      {/* Scrollable area: welcome screen or the conversation thread */}
      <div className="flex-1 overflow-y-auto">
        {!hasChat ? (
          <div className="mx-auto max-w-2xl px-5 py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/25 to-teal-500/5 ring-1 ring-teal-400/30">
                <Sparkles className="h-7 w-7 text-teal-400" />
              </div>
              <h2 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-2xl font-bold text-transparent">
                What do you want to know?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                Ask anything about the markets in your own words — answers are grounded in today&apos;s
                regime and headlines, not stale model memory. Or start with one of these.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {FEATURED.map(({ icon: Icon, q }) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-left transition-all hover:border-teal-400/40 hover:bg-gray-900/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="shrink-0 rounded-lg bg-teal-500/10 p-2 text-teal-400">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm text-gray-200 group-hover:text-white">{q}</span>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Browse by topic
                </p>
                <button
                  type="button"
                  onClick={surpriseMe}
                  disabled={loading}
                  className="group flex items-center gap-1.5 text-xs text-teal-400 transition-colors hover:text-teal-300 hover:underline disabled:opacity-40"
                >
                  <Dices size={14} className="transition-transform group-hover:rotate-12" /> Surprise me
                </button>
              </div>
              {promptBrowser}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? `max-w-[88%] rounded-2xl rounded-br-md bg-teal-500/15 px-4 py-2.5 ${fontClass} text-gray-100`
                      : `max-w-[88%] rounded-2xl rounded-bl-md border border-gray-800/60 bg-gray-800/40 px-4 py-2.5 ${fontClass} leading-relaxed text-gray-200`
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
      </div>

      {/* Composer — always pinned at the bottom */}
      <form onSubmit={onSubmit} className="border-t border-gray-800/60 bg-gray-900/50 px-3 pb-3 pt-2.5">
        {hasChat && (
          <div className="mb-2 flex items-center gap-4 px-1">
            <button
              type="button"
              onClick={() => setLibraryOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 transition-colors hover:text-teal-300"
            >
              <BookOpen size={13} /> {libraryOpen ? 'Hide prompts' : 'Browse prompts'}
            </button>
            <button
              type="button"
              onClick={surpriseMe}
              disabled={loading}
              className="group flex items-center gap-1.5 text-[11px] text-gray-400 transition-colors hover:text-teal-300 disabled:opacity-40"
            >
              <Dices size={13} className="transition-transform group-hover:rotate-12" /> Surprise me
            </button>
          </div>
        )}
        {hasChat && libraryOpen && (
          <div className="mb-3 rounded-xl border border-gray-800 bg-gray-950/40 p-3">{promptBrowser}</div>
        )}

        {isAuthed ? (
          <>
            <div className="flex items-end gap-2 rounded-xl border border-gray-700 bg-gray-800/60 p-1.5 transition-colors focus-within:border-teal-400/50">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoGrow();
                }}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask anything about the markets…"
                className="max-h-40 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-black transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-gray-500">
              Live market context &amp; headlines — informational only, not advice. Enter to send, Shift+Enter for a new line.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-4 text-center">
            <p className="text-sm text-gray-300">
              Ask the Markets is free for members — sign in to start a conversation.
            </p>
            <a
              href={SIGN_IN_URL}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-teal-950 transition-colors hover:bg-teal-400"
            >
              <Sparkles className="h-4 w-4" /> Sign in to ask
            </a>
          </div>
        )}
      </form>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
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
      'Is the S&P 500 above its 200-day trend?',
      'Is market breadth confirming the trend?',
      'Is tech (Nasdaq) leading or lagging the S&P?',
      "What's the Crypto Fear & Greed reading?",
    ],
  },
  {
    label: 'Markets today',
    questions: [
      'How are the major indices doing today?',
      "What's happening with oil and gold?",
      'Is the US dollar strong or weak right now?',
      'How are global markets (FTSE, Nikkei) trading?',
    ],
  },
  {
    label: 'Headlines & basics',
    questions: [
      'What should I watch this week?',
      "What are today's biggest market headlines?",
      'Explain the yield curve simply.',
    ],
  },
];

export default function AskMarkets() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setError('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setLoading(true);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    try {
      const res = await askMarkets(next);
      if (res.ok) {
        setMessages([...next, { role: 'assistant', content: res.answer }]);
      } else {
        setError(res.error);
      }
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Conversation thread */}
      {messages.length > 0 && (
        <div className="flex min-h-[120px] flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-teal-500/15 px-4 py-2.5 text-sm text-gray-100'
                    : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-gray-800 bg-gray-900/40 px-4 py-2.5 text-sm leading-relaxed text-gray-300'
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

      {/* Preset questions — the only way to ask. Grouped by the data they tap. */}
      <div className="space-y-4 border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          {messages.length > 0 ? 'Ask another question' : 'Pick a question to get started'}
        </p>
        {QUESTION_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.questions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-teal-500/40 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-600">
        Answers use live market context &amp; headlines — informational only, not advice.
      </p>
    </div>
  );
}

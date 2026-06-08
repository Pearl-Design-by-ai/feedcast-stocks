'use client';

import { useRef, useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { askMarkets, type ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';

const SUGGESTIONS = [
    'What’s the market regime right now and why?',
    'Are conditions risk-on or risk-off today?',
    'What should I watch this week?',
    'Explain the yield curve simply.',
];

export default function AskMarkets() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const endRef = useRef<HTMLDivElement | null>(null);

    async function send(text: string) {
        const question = text.trim();
        if (!question || loading) return;
        setError('');
        const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
        setMessages(next);
        setInput('');
        setLoading(true);
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
            {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            className="rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex min-h-[200px] flex-col gap-4">
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

            <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-gray-800 bg-gray-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0 md:backdrop-blur-none">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        send(input);
                    }}
                    className="flex gap-2"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the market…"
                        aria-label="Ask about the market"
                        className="h-11 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-500 px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-teal-400 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>

                <p className="text-[11px] text-gray-600">
                    Answers use live market context &amp; headlines — informational only, not advice.
                </p>
            </div>
        </div>
    );
}

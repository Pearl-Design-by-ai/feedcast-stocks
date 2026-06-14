'use client';

import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, Loader2, ArrowUp, RotateCcw } from 'lucide-react';
import { askAboutStock } from '@/lib/actions/stock-ai.actions';
import type { ChatMessage } from '@/lib/actions/ask.actions';
import { MarkdownLite } from '@/components/ask/MarkdownLite';

const THINKING = ['Reading the tape…', 'Checking the filings…', 'Weighing both sides…'];

/** Per-stock free chat, grounded on the symbol's live data via the engine. */
export default function StockChat({ symbol, name }: { symbol: string; name: string }) {
    const sym = symbol.toUpperCase();
    const starters = [
        `Why has ${sym} performed the way it has this year?`,
        `What's the bull case for ${sym}?`,
        `What's the bear case for ${sym}?`,
        `What are analysts expecting?`,
        `Is ${sym} cheap or expensive right now?`,
    ];

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [thinking, setThinking] = useState(THINKING[0]);
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, loading]);

    async function send(text: string) {
        const q = text.trim();
        if (!q || loading) return;
        setError('');
        setInput('');
        setThinking(THINKING[Math.floor(Math.random() * THINKING.length)]);
        const next = [...messages, { role: 'user' as const, content: q }];
        setMessages(next);
        setLoading(true);
        try {
            const res = await askAboutStock(sym, name, next);
            if (res.ok) setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }]);
            else setError(res.error);
        } finally {
            setLoading(false);
        }
    }

    const hasChat = messages.length > 0;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                    <MessagesSquare className="h-4 w-4 text-teal-400" /> Ask about {sym}
                </h3>
                {hasChat && (
                    <button
                        type="button"
                        onClick={() => { setMessages([]); setError(''); }}
                        disabled={loading}
                        className="flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-teal-300 disabled:opacity-30"
                    >
                        <RotateCcw size={12} /> New chat
                    </button>
                )}
            </div>

            {hasChat ? (
                <div className="mb-3 flex max-h-80 flex-col gap-2.5 overflow-y-auto">
                    {messages.map((m, i) => (
                        <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                            <div
                                className={
                                    m.role === 'user'
                                        ? 'max-w-[90%] rounded-2xl rounded-br-md bg-teal-500/15 px-3 py-2 text-sm text-gray-100'
                                        : 'max-w-[90%] rounded-2xl rounded-bl-md border border-gray-800/60 bg-gray-800/40 px-3 py-2 text-sm leading-relaxed text-gray-200'
                                }
                            >
                                {m.role === 'assistant' ? <MarkdownLite text={m.content} /> : m.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" /> {thinking}
                        </div>
                    )}
                    {error && <p className="text-xs text-yellow-200/80">{error}</p>}
                    <div ref={endRef} />
                </div>
            ) : (
                <div className="mb-3 flex flex-col gap-1.5">
                    <p className="mb-1 text-xs text-gray-500">
                        Ask anything about {name} — answers use its live data &amp; headlines.
                    </p>
                    {starters.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            disabled={loading}
                            className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-left text-[13px] text-gray-300 transition-colors hover:border-teal-400/40 hover:text-teal-200 disabled:opacity-40"
                        >
                            <span className="mt-px text-gray-600">›</span>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-end gap-2 rounded-xl border border-gray-700 bg-gray-800/60 p-1.5 transition-colors focus-within:border-teal-400/50"
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                    }}
                    rows={1}
                    placeholder={`Ask about ${sym}…`}
                    className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-black transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={15} />}
                </button>
            </form>
            <p className="mt-2 text-[11px] text-gray-600">Informational only — not investment advice.</p>
        </div>
    );
}

'use server';

/**
 * Proxy shim → PRIVATE markets-engine. The grounded "Ask the Markets" chat
 * (prompts + live context assembly) runs in the closed engine; this only
 * forwards the conversation. See `lib/engine-client.ts`.
 */

import { enginePost } from '@/lib/engine-client';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type AskResult = { ok: true; answer: string } | { ok: false; error: string };

// The UI only sends preset questions, but the action is callable from any
// authenticated client — bound the payload so crafted calls can't ship huge
// conversations into the engine's LLM context.
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 2_000;

export async function askMarkets(messages: ChatMessage[]): Promise<AskResult> {
    if (!Array.isArray(messages) || messages.length === 0) {
        return { ok: false, error: 'Nothing to ask.' };
    }
    const bounded = messages.slice(-MAX_MESSAGES).map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: String(m.content ?? '').slice(0, MAX_MESSAGE_CHARS),
    }));

    return enginePost<AskResult>(
        '/v1/ask',
        { messages: bounded },
        { ok: false, error: 'AI chat is not configured yet.' },
        30_000
    );
}

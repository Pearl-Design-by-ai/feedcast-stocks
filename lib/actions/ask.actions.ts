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

export async function askMarkets(messages: ChatMessage[]): Promise<AskResult> {
    return enginePost<AskResult>(
        '/v1/ask',
        { messages },
        { ok: false, error: 'AI chat is not configured yet.' },
        30_000
    );
}

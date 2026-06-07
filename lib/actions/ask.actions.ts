'use server';

/**
 * "Ask the Markets" — a grounded AI chat. Each question is answered by DeepSeek
 * with live context injected (the computed market regime + recent headlines), so
 * answers reflect the current tape rather than a stale model prior.
 */

import { getMarketRegime } from '@/lib/actions/regime.actions';
import { getNews } from '@/lib/actions/finnhub.actions';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type AskResult = { ok: true; answer: string } | { ok: false; error: string };

async function buildContext(): Promise<string> {
    const [regime, news] = await Promise.all([
        getMarketRegime().catch(() => null),
        getNews().catch(() => []),
    ]);
    const parts: string[] = [];
    if (regime) {
        parts.push(
            `Current market regime: ${regime.verdict} (risk score ${regime.score}/100). ` +
                `Signals: ${regime.signals.map((s) => `${s.label} = ${s.state}`).join('; ')}.`
        );
    }
    if (news?.length) {
        parts.push('Recent market headlines:\n' + news.slice(0, 12).map((a) => `- ${a.headline}`).join('\n'));
    }
    return parts.join('\n\n') || 'No live context available.';
}

export async function askMarkets(messages: ChatMessage[]): Promise<AskResult> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) return { ok: false, error: 'AI chat is not configured yet.' };
    if (!messages.length) return { ok: false, error: 'Ask a question to get started.' };

    try {
        const context = await buildContext();
        const system =
            'You are a helpful, plain-spoken markets assistant inside a stock-tracking app. Answer ' +
            "the user's question clearly and concisely, using the LIVE CONTEXT below when relevant. " +
            'Be factual and balanced, avoid hype, and do NOT give personalized financial advice or ' +
            'specific buy/sell calls — you may explain trade-offs and what to watch generally. If the ' +
            'context does not contain the answer, say what you would look at. Keep answers under ~150 ' +
            `words.\n\nLIVE CONTEXT:\n${context}`;

        const convo = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25_000);
        const res = await fetch(DEEPSEEK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: system }, ...convo],
                temperature: 0.4,
                max_tokens: 500,
                stream: false,
            }),
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);

        if (!res.ok) {
            let detail = '';
            try {
                const errJson = (await res.json()) as { error?: { message?: string } };
                detail = errJson?.error?.message ?? '';
            } catch {
                /* ignore */
            }
            return { ok: false, error: `Request failed (${res.status})${detail ? `: ${detail}` : ''}.` };
        }

        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const answer = (json.choices?.[0]?.message?.content ?? '').trim();
        if (!answer) return { ok: false, error: 'No answer — please try again.' };
        return { ok: true, answer };
    } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        return { ok: false, error: aborted ? 'The request timed out. Please try again.' : 'Something went wrong.' };
    }
}

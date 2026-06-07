'use server';

/**
 * DeepSeek-powered plain-language explanations for the Market Indicators.
 *
 * Each indicator card has an AI button that calls `explainIndicator()` to get a
 * short, retail-friendly breakdown: what it measures, why it matters, what to
 * watch for, and when to use it. DeepSeek exposes an OpenAI-compatible Chat
 * Completions API, so this is a single JSON-mode call.
 *
 * Server-only key (no NEXT_PUBLIC_): set DEEPSEEK_API_KEY as a Worker secret.
 */

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export interface IndicatorExplanation {
    summary: string; // what it measures, in plain language
    importance: string; // why it matters
    watch: string; // key levels / signals to watch for
    when: string; // when / how to use it
}

export type ExplainResult =
    | { ok: true; data: IndicatorExplanation }
    | { ok: false; error: string };

// Best-effort in-isolate cache — these explanations are effectively static per
// indicator, so we only ever hit DeepSeek once per name per worker instance.
const cache = new Map<string, IndicatorExplanation>();

const SYSTEM_PROMPT =
    'You are a markets educator writing for retail investors who are new to technical analysis. ' +
    'Explain the given stock-market indicator in clear, simple, jargon-light language. ' +
    'Be accurate and practical, avoid hype, and never give personalized financial advice. ' +
    'Respond ONLY with a JSON object using exactly these keys: ' +
    '"summary" (1-2 sentences: what the indicator measures), ' +
    '"importance" (1-2 sentences: why it matters to the broad market), ' +
    '"watch" (1-2 sentences: the key levels, crossovers, or signals to watch for), ' +
    '"when" (1-2 sentences: when or how an investor would use it). ' +
    'Keep each value under ~45 words. Example: ' +
    '{"summary":"...","importance":"...","watch":"...","when":"..."}';

function buildUserPrompt(name: string, blurb: string, category?: string): string {
    const ctx = category ? ` It belongs to the "${category}" group of market indicators.` : '';
    return (
        `Explain the market indicator "${name}".${ctx} ` +
        `For context, a one-line description is: "${blurb}". ` +
        `Return the JSON object described in the system prompt.`
    );
}

function parseExplanation(content: string): IndicatorExplanation | null {
    // JSON mode returns a bare object, but strip stray code fences just in case.
    const cleaned = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
        const obj = JSON.parse(cleaned) as Partial<IndicatorExplanation>;
        if (obj.summary && obj.importance && obj.watch && obj.when) {
            return {
                summary: String(obj.summary),
                importance: String(obj.importance),
                watch: String(obj.watch),
                when: String(obj.when),
            };
        }
    } catch {
        // fall through
    }
    return null;
}

export async function explainIndicator(
    name: string,
    blurb: string,
    category?: string
): Promise<ExplainResult> {
    // Read the key per-request: on Cloudflare Workers, env/secrets are bound to
    // the request context, and a secret added after deploy isn't reflected in a
    // value captured at module load. Reading it here always sees the latest.
    // Trim defensively — a stray trailing newline/space in the secret (common
    // when pasting into the dashboard or piping into `wrangler secret put`)
    // otherwise reaches DeepSeek verbatim and triggers a 401.
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) {
        return { ok: false, error: 'AI explanations are not configured yet.' };
    }

    const cached = cache.get(name);
    if (cached) return { ok: true, data: cached };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);

        const res = await fetch(DEEPSEEK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: buildUserPrompt(name, blurb, category) },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 500,
                stream: false,
            }),
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);

        if (!res.ok) {
            // Surface DeepSeek's own reason (e.g. "Authentication Fails") so a
            // bad/expired key or empty balance is obvious from the dialog.
            let detail = '';
            try {
                const errJson = (await res.json()) as { error?: { message?: string } };
                detail = errJson?.error?.message ?? '';
            } catch {
                // non-JSON error body — ignore
            }
            return {
                ok: false,
                error: `DeepSeek request failed (${res.status})${detail ? `: ${detail}` : ''}.`,
            };
        }

        const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const content = json.choices?.[0]?.message?.content ?? '';
        const parsed = parseExplanation(content);

        if (!parsed) {
            return { ok: false, error: 'Could not read the AI response. Please try again.' };
        }

        cache.set(name, parsed);
        return { ok: true, data: parsed };
    } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        return {
            ok: false,
            error: aborted ? 'The AI request timed out. Please try again.' : 'Something went wrong reaching the AI.',
        };
    }
}

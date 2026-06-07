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

import { getNews } from '@/lib/actions/finnhub.actions';

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

// ── AI daily market brief ──────────────────────────────────────────────────

export interface MarketBrief {
    points: string[];
}

let briefCache: { at: number; data: MarketBrief } | null = null;
const BRIEF_TTL_MS = 30 * 60 * 1000; // 30 minutes

const BRIEF_SYSTEM_PROMPT =
    'You are a concise markets editor. Using ONLY the provided news headlines, write 3-4 short, ' +
    'factual bullet points summarizing today’s key market themes and overall mood. Do NOT invent ' +
    'prices, levels or numbers that are not in the headlines, and give no investment advice. Keep ' +
    'each bullet under ~25 words. Respond ONLY as JSON: {"points": ["...", "..."]}';

/**
 * A short, DeepSeek-written market brief grounded in the latest general market
 * news (so it can't hallucinate "today"). Cached ~30 min; returns null when the
 * key/news are unavailable so the homepage can simply omit the card.
 */
export async function getMarketBrief(): Promise<MarketBrief | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) return null;

    if (briefCache && Date.now() - briefCache.at < BRIEF_TTL_MS) return briefCache.data;

    try {
        const news = await getNews();
        if (!news?.length) return null;

        const headlines = news
            .slice(0, 14)
            .map((a) => {
                const summary = a.summary ? `: ${String(a.summary).slice(0, 160)}` : '';
                return `- ${a.headline}${summary}`;
            })
            .join('\n');

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
                    { role: 'system', content: BRIEF_SYSTEM_PROMPT },
                    { role: 'user', content: `Today's market headlines:\n${headlines}` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 400,
                stream: false,
            }),
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);
        if (!res.ok) return null;

        const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const content = (json.choices?.[0]?.message?.content ?? '').trim();
        const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned) as { points?: unknown };
        const points = Array.isArray(parsed.points)
            ? parsed.points.map((p) => String(p)).filter(Boolean).slice(0, 5)
            : [];
        if (!points.length) return null;

        const data: MarketBrief = { points };
        briefCache = { at: Date.now(), data };
        return data;
    } catch {
        return null;
    }
}

// ── AI company summary & watchlist digest ──────────────────────────────────

const companyBriefCache = new Map<string, { at: number; text: string }>();
const digestCache = new Map<string, { at: number; data: MarketBrief }>();
const NEWS_BRIEF_TTL_MS = 30 * 60 * 1000;

async function summariseHeadlines(
    apiKey: string,
    system: string,
    user: string,
    asPoints: boolean
): Promise<unknown | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
        const res = await fetch(DEEPSEEK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: asPoints ? 400 : 300,
                stream: false,
            }),
            signal: controller.signal,
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = (json.choices?.[0]?.message?.content ?? '').trim();
        const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export interface CompanyBrief {
    text: string;
}

/** A 2-3 sentence plain-language company summary grounded in recent headlines. */
export async function getCompanyBrief(symbol: string, name: string): Promise<CompanyBrief | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) return null;

    const key = symbol.toUpperCase();
    const cached = companyBriefCache.get(key);
    if (cached && Date.now() - cached.at < NEWS_BRIEF_TTL_MS) return { text: cached.text };

    const news = await getNews([symbol]).catch(() => []);
    const headlines = (news ?? [])
        .slice(0, 10)
        .map((a) => `- ${a.headline}`)
        .join('\n');

    const system =
        'You are a concise equity analyst. In 2-3 plain-language sentences, explain what the ' +
        'company does and the current narrative around it. Use the headlines for the recent ' +
        'narrative; do not invent prices/numbers and give no investment advice. Respond ONLY as ' +
        'JSON: {"summary": "..."}';
    const user = `Company: ${name} (${key}).${headlines ? `\nRecent headlines:\n${headlines}` : ''}`;

    const parsed = (await summariseHeadlines(apiKey, system, user, false)) as { summary?: unknown } | null;
    const text = parsed?.summary ? String(parsed.summary).trim() : '';
    if (!text) return null;

    companyBriefCache.set(key, { at: Date.now(), text });
    return { text };
}

/** A short digest of what's happening across a set of watchlist symbols. */
export async function getWatchlistDigest(symbols: string[]): Promise<MarketBrief | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey || !symbols.length) return null;

    const key = [...symbols].map((s) => s.toUpperCase()).sort().join(',');
    const cached = digestCache.get(key);
    if (cached && Date.now() - cached.at < NEWS_BRIEF_TTL_MS) return cached.data;

    const news = await getNews(symbols).catch(() => []);
    if (!news?.length) return null;
    const headlines = news.slice(0, 16).map((a) => `- ${a.headline}`).join('\n');

    const system =
        'You are a concise markets editor. Based ONLY on these headlines about a user’s watchlist, ' +
        'write 3-4 short, factual bullets on what’s happening across these names. No invented ' +
        'numbers, no advice. Respond ONLY as JSON: {"points": ["...", "..."]}';
    const user = `Watchlist: ${symbols.map((s) => s.toUpperCase()).join(', ')}\nHeadlines:\n${headlines}`;

    const parsed = (await summariseHeadlines(apiKey, system, user, true)) as { points?: unknown } | null;
    const points = Array.isArray(parsed?.points)
        ? parsed!.points.map((p) => String(p)).filter(Boolean).slice(0, 5)
        : [];
    if (!points.length) return null;

    const data: MarketBrief = { points };
    digestCache.set(key, { at: Date.now(), data });
    return data;
}

// ── Bull vs Bear ────────────────────────────────────────────────────────────

export interface BullBear {
    bull: string[];
    bear: string[];
}

const bullBearCache = new Map<string, { at: number; data: BullBear }>();

/** The strongest bull and bear cases for a ticker, grounded in recent headlines. */
export async function getBullBear(symbol: string, name: string): Promise<BullBear | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey) return null;

    const key = symbol.toUpperCase();
    const cached = bullBearCache.get(key);
    if (cached && Date.now() - cached.at < NEWS_BRIEF_TTL_MS) return cached.data;

    const news = await getNews([symbol]).catch(() => []);
    const headlines = (news ?? []).slice(0, 12).map((a) => `- ${a.headline}`).join('\n');

    const system =
        'You are a balanced equity analyst. Give the 3 strongest BULL points and the 3 strongest ' +
        'BEAR points for the company, grounded in the headlines and general knowledge. Be specific ' +
        'and concise (each point under ~20 words), factual, no price targets, no advice. Respond ' +
        'ONLY as JSON: {"bull": ["...","...","..."], "bear": ["...","...","..."]}';
    const user = `Company: ${name} (${key}).${headlines ? `\nRecent headlines:\n${headlines}` : ''}`;

    const parsed = (await summariseHeadlines(apiKey, system, user, true)) as
        | { bull?: unknown; bear?: unknown }
        | null;
    const bull = Array.isArray(parsed?.bull) ? parsed!.bull.map((x) => String(x)).filter(Boolean).slice(0, 4) : [];
    const bear = Array.isArray(parsed?.bear) ? parsed!.bear.map((x) => String(x)).filter(Boolean).slice(0, 4) : [];
    if (!bull.length && !bear.length) return null;

    const data: BullBear = { bull, bear };
    bullBearCache.set(key, { at: Date.now(), data });
    return data;
}

// ── Portfolio X-ray & News impact ───────────────────────────────────────────

export interface XrayHolding {
    symbol: string;
    weight: number; // percent of portfolio
}

/** AI risk analysis of a portfolio given holdings + weights. */
export async function getPortfolioXray(holdings: XrayHolding[]): Promise<MarketBrief | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey || !holdings.length) return null;

    const list = holdings
        .slice(0, 40)
        .map((h) => `${h.symbol.toUpperCase()} ${h.weight.toFixed(1)}%`)
        .join(', ');

    const system =
        'You are a portfolio risk analyst. Given holdings with weights, analyze the portfolio in ' +
        '4-5 short, specific bullets: concentration, sector/factor tilt, diversification, and the ' +
        'key risks (what scenarios would hurt it most). Be concrete, factual, no price targets and ' +
        'no personalized advice. Respond ONLY as JSON: {"points": ["...", "..."]}';
    const user = `Holdings (symbol weight): ${list}`;

    const parsed = (await summariseHeadlines(apiKey, system, user, true)) as { points?: unknown } | null;
    const points = Array.isArray(parsed?.points)
        ? parsed!.points.map((p) => String(p)).filter(Boolean).slice(0, 6)
        : [];
    if (!points.length) return null;
    return { points };
}

export interface NewsImpactItem {
    headline: string;
    symbol: string;
    impact: 'positive' | 'negative' | 'neutral';
}

const newsImpactCache = new Map<string, { at: number; data: NewsImpactItem[] }>();

/** Tag recent headlines with which watchlist symbol they hit and the direction. */
export async function getNewsImpact(symbols: string[]): Promise<NewsImpactItem[] | null> {
    const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
    if (!apiKey || !symbols.length) return null;

    const upper = symbols.map((s) => s.toUpperCase());
    const key = [...upper].sort().join(',');
    const cached = newsImpactCache.get(key);
    if (cached && Date.now() - cached.at < NEWS_BRIEF_TTL_MS) return cached.data;

    const news = await getNews(symbols).catch(() => []);
    if (!news?.length) return null;
    const headlines = news.slice(0, 12).map((a) => `- ${a.headline}`).join('\n');

    const system =
        'For each headline, identify which ONE symbol from the provided list it most affects and the ' +
        'likely direction for that stock: "positive", "negative" or "neutral". Only use symbols from ' +
        'the list; skip headlines that do not clearly map to one. Respond ONLY as JSON: ' +
        '{"items": [{"headline": "...", "symbol": "TICKER", "impact": "positive|negative|neutral"}]}';
    const user = `Symbols: ${upper.join(', ')}\nHeadlines:\n${headlines}`;

    const parsed = (await summariseHeadlines(apiKey, system, user, true)) as { items?: unknown } | null;
    const allowed = new Set(upper);
    const items: NewsImpactItem[] = Array.isArray(parsed?.items)
        ? parsed!.items
              .map((raw) => {
                  const it = raw as { headline?: unknown; symbol?: unknown; impact?: unknown };
                  const symbol = String(it.symbol ?? '').toUpperCase();
                  const impact = String(it.impact ?? 'neutral');
                  const headline = String(it.headline ?? '').trim();
                  return { headline, symbol, impact } as NewsImpactItem;
              })
              .filter(
                  (it) =>
                      it.headline &&
                      allowed.has(it.symbol) &&
                      ['positive', 'negative', 'neutral'].includes(it.impact)
              )
              .slice(0, 12)
        : [];
    if (!items.length) return null;

    newsImpactCache.set(key, { at: Date.now(), data: items });
    return items;
}

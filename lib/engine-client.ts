'use server';

/**
 * Thin client for the PRIVATE markets-engine (a separate program reached over a
 * generic HTTP API). Only the public app's server calls this — the bearer token
 * is a server-side secret and never reaches the browser.
 *
 * Every call degrades gracefully: if the engine is unconfigured, unreachable, or
 * errors, we return `fallback` so the AI/analysis features simply hide rather
 * than break the page.
 */

const BASE = (process.env.MARKETS_ENGINE_URL ?? '').replace(/\/$/, '');
const TOKEN = (process.env.MARKETS_ENGINE_TOKEN ?? '').trim();

async function call<T>(
  path: string,
  init: RequestInit & { fallback: T; timeoutMs?: number }
): Promise<T> {
  const { fallback, timeoutMs = 28_000, ...rest } = init;
  if (!BASE || !TOKEN) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...rest.headers,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

/** GET with query params. */
export async function engineGet<T>(path: string, params: Record<string, string>, fallback: T): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  return call<T>(`${path}${qs ? `?${qs}` : ''}`, { method: 'GET', fallback });
}

/** POST with a JSON body. */
export async function enginePost<T>(path: string, body: unknown, fallback: T, timeoutMs?: number): Promise<T> {
  return call<T>(path, { method: 'POST', body: JSON.stringify(body), fallback, timeoutMs });
}

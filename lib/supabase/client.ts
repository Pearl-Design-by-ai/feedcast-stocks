'use client';

/**
 * Browser Supabase client. Uses `@supabase/ssr`'s `createBrowserClient`
 * with cookie storage scoped to `.feedcast.news` so the auth session is
 * shared between `www.feedcast.news` and `markets.feedcast.news`.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCookieOptions, SESSION_STORAGE_KEY } from './cookie-storage';

let _client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing Supabase env vars');

  const host =
    typeof window !== 'undefined' ? window.location.hostname : undefined;

  _client = createBrowserClient(url, anonKey, {
    cookieOptions: getCookieOptions(host),
    // Pinned to match Feedcast's cookie name — see cookie-storage.ts.
    auth: { storageKey: SESSION_STORAGE_KEY },
  });

  return _client;
}

/** Convenience proxy so callers can `import { supabase } from '.../client'`. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (
      getSupabaseBrowserClient() as unknown as Record<string | symbol, unknown>
    )[prop];
  },
});

/**
 * Server Supabase client for Server Components, Server Actions and Route
 * Handlers. Reads/writes the auth session through Next.js `cookies()`.
 *
 * Cookies are scoped to `.feedcast.news` (see `cookie-storage.ts`) so the
 * SSO session set by the main Feedcast app is visible here.
 */

import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCookieOptions } from './cookie-storage';

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing Supabase env vars');

  const cookieStore = await cookies();

  let host: string | undefined;
  try {
    host = (await headers()).get('host') ?? undefined;
  } catch {
    host = undefined;
  }

  return createServerClient(url, anonKey, {
    cookieOptions: getCookieOptions(host),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` can be called from a Server Component, where mutating
          // cookies is not allowed. Safe to ignore — the middleware /
          // route handler refreshes the session instead.
        }
      },
    },
  });
}

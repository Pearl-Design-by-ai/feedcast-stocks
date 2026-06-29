import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  getCookieOptions,
  SESSION_STORAGE_KEY,
} from '@/lib/supabase/cookie-storage';

/**
 * Session-refresh passthrough. Feedcast Stocks has no sign-in pages of its
 * own — auth is handled by the main Feedcast app (SSO). The Supabase session
 * cookie is scoped to `.feedcast.news`, so a user signed in on
 * `www.feedcast.news` is already signed in here.
 *
 * The site is PUBLIC for SEO, so this does NOT gate anonymous visitors — it
 * only refreshes the session cookie when present. Membership is enforced where
 * it matters instead: members-only pages self-gate (redirect / notFound) and
 * the costly on-demand AI actions check `getCurrentUser()`.
 *
 * NOTE: this file lives at `middleware/index.ts`, which Next.js does NOT pick
 * up as middleware (it expects a root `middleware.ts`). It is currently inert;
 * kept here so the SSO session-refresh logic is ready if we ever wire it.
 *
 * `/api/*` is excluded from the matcher — `/api/cron/*` carries its own
 * Bearer-token auth and must stay reachable.
 */

export async function middleware(request: NextRequest) {
    // `response` collects any refreshed-session cookies Supabase wants to set.
    const response = NextResponse.next({ request });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Without env we can't refresh the session — but the site is public, so
    // just let the request through unauthenticated.
    if (!url || !anonKey) {
        return response;
    }

    const supabase = createServerClient(url, anonKey, {
        cookieOptions: getCookieOptions(request.headers.get('host')),
        // Pinned to match Feedcast's cookie name — see cookie-storage.ts.
        auth: { storageKey: SESSION_STORAGE_KEY },
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    response.cookies.set(name, value, options);
                }
            },
        },
    });

    // Touch the session so Supabase can rotate the cookie if needed; no gating.
    await supabase.auth.getUser();

    return response;
}

export const config = {
    matcher: [
        // Protect everything except API routes, Next internals and static
        // assets. `/api` is excluded so `/api/cron/*` (own Bearer auth)
        // stays public-ish.
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};

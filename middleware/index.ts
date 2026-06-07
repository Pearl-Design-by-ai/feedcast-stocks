import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  getCookieOptions,
  SESSION_STORAGE_KEY,
} from '@/lib/supabase/cookie-storage';

/**
 * Auth gate. Feedcast Markets has no sign-in pages of its own — auth is
 * handled by the main Feedcast app (SSO). The Supabase session cookie is
 * scoped to `.feedcast.news`, so a user signed in on `www.feedcast.news`
 * is already signed in here.
 *
 * If there is no authenticated Supabase user, bounce to the Feedcast
 * sign-in with a `?signin=markets` hint so it can return the user here.
 *
 * `/api/*` is excluded from the matcher entirely — `/api/cron/*` carries
 * its own Bearer-token auth and must stay reachable.
 */

const SIGN_IN_URL = 'https://www.feedcast.news/?signin=markets';

// Legacy host — the module was rebranded from `stocks` to `markets`.
// Permanently redirect any leftover bookmarks/links to the new domain.
const LEGACY_HOST = 'stocks.feedcast.news';
const CANONICAL_HOST = 'markets.feedcast.news';

export async function middleware(request: NextRequest) {
    // Rebrand redirect: stocks.feedcast.news → markets.feedcast.news (same path).
    if (request.headers.get('host') === LEGACY_HOST) {
        const target = new URL(request.url);
        target.host = CANONICAL_HOST;
        return NextResponse.redirect(target, 301);
    }

    // `response` collects any refreshed-session cookies Supabase wants to set.
    const response = NextResponse.next({ request });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If env is missing we can't verify — fail closed to the sign-in page.
    if (!url || !anonKey) {
        return NextResponse.redirect(SIGN_IN_URL);
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(SIGN_IN_URL);
    }

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

/**
 * Cookie options for the Supabase auth session.
 *
 * Feedcast Stocks runs at `stocks.feedcast.news` and shares the Supabase
 * project with the main Feedcast app at `www.feedcast.news`. To make the
 * SSO session usable across both subdomains, the auth cookies are scoped
 * to the parent domain `.feedcast.news`.
 *
 * On localhost we fall back to no `domain` so the browser accepts the
 * cookie during development.
 */

export const SESSION_COOKIE_DOMAIN = '.feedcast.news';

/**
 * Auth-cookie storage key. Pinned to the SAME value the main Feedcast app
 * uses (`AUTH_STORAGE_KEY` in `web/lib/supabase.ts`). `@supabase/ssr`
 * otherwise derives this name from the Supabase URL host, and the two apps'
 * `NEXT_PUBLIC_SUPABASE_URL` values differ — so the derived cookie names
 * diverged and this app could not see the SSO session set by Feedcast.
 * Must stay byte-for-byte identical to Feedcast's value.
 */
export const SESSION_STORAGE_KEY = 'sb-zaoqirzyqlhgegpxelqo-all-auth-token';

type CookieOptions = {
  domain?: string;
  path: string;
  sameSite: 'lax';
  secure: boolean;
  maxAge?: number;
};

/**
 * Resolve the cookie options for a given host. Pass the request host
 * (server) or `window.location.hostname` (browser). When the host is a
 * localhost / 127.0.0.1 / *.local dev host we omit `domain` + `secure`.
 */
export function getCookieOptions(host?: string | null): CookieOptions {
  const isLocal =
    !host ||
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.local');

  if (isLocal) {
    return { path: '/', sameSite: 'lax', secure: false };
  }

  return {
    domain: SESSION_COOKIE_DOMAIN,
    path: '/',
    sameSite: 'lax',
    secure: true,
  };
}

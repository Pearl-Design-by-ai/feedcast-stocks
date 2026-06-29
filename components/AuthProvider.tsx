'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Lightweight auth-state context for client components. The site is public for
 * SEO, so most UI renders for anonymous visitors; client components that gate a
 * costly, members-only action (e.g. the Ask composer, the Explain button) read
 * `useIsAuthed()` to show a sign-in CTA instead of letting the call fail. The
 * value is resolved once on the server in the (root) layout — no client fetch.
 */
const AuthContext = createContext(false);

export function AuthProvider({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={isAuthed}>{children}</AuthContext.Provider>;
}

export function useIsAuthed(): boolean {
  return useContext(AuthContext);
}

'use client';

/**
 * Cookieless page-view beacon. Sends one tiny POST to /api/a per page view —
 * on first load and on every App Router navigation. Sets no cookies, keeps no
 * localStorage ID and loads no third-party script; the server derives a
 * daily-rotating hash and honours DNT / Sec-GPC.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BEACON_PATH, classifyDevice, normalizePath } from '@/lib/analytics/shared';
import { SESSION_STORAGE_KEY } from '@/lib/supabase/cookie-storage';

function send(body: string) {
    try {
        if (navigator.sendBeacon?.(BEACON_PATH, body)) return;
    } catch {
        // fall through to fetch
    }
    fetch(BEACON_PATH, { method: 'POST', body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
}

export default function PageViewBeacon() {
    const pathname = usePathname();
    const search = useSearchParams()?.toString() ?? '';
    const last = useRef<string | null>(null);
    const first = useRef(true);

    // Only whitelisted query keys matter, so e.g. a ?list= switch isn't a new view.
    const key = normalizePath(`${pathname}${search ? `?${search}` : ''}`);

    useEffect(() => {
        if (!key || key === last.current) return;
        last.current = key;

        // External referrer only on the landing view; later views are in-app navigations.
        let ref = '';
        if (first.current && document.referrer) {
            try {
                const host = new URL(document.referrer).host;
                if (host !== window.location.host) ref = host;
            } catch {
                // ignore malformed referrers
            }
        }
        first.current = false;

        send(
            JSON.stringify({
                path: key,
                ref,
                device: classifyDevice(window.innerWidth),
                // Presence of the SSO session cookie — verified server-side.
                signedIn: document.cookie.includes(SESSION_STORAGE_KEY),
                webdriver: navigator.webdriver === true,
            }),
        );
    }, [key]);

    return null;
}

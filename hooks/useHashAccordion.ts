'use client';

import { useEffect, useState } from 'react';

/**
 * Accordion open-state synced to the URL hash so the left-rail sub-nav can
 * deep-link straight to a section — e.g. visiting `/market-indicators#trend`
 * (or clicking it in the sidebar while already on the page) opens the Trend
 * category and scrolls it into view, with no second click needed.
 *
 * Why we patch history: Next.js <Link> navigations change the hash via
 * `history.pushState`/`replaceState`, which (unlike a real anchor click or
 * back/forward) do NOT fire the native `hashchange` event. So a same-page
 * sidebar link would update the URL but never reach a `hashchange` listener.
 * We wrap pushState/replaceState to emit a synthetic `locationchange` event
 * and listen for that too, restoring the originals on unmount.
 *
 * `validIds` is expected to be a stable, module-level list (the category ids).
 * Returns the same `[openId, setOpenId]` tuple as useState so callers are a
 * drop-in replacement; manual clicks on the accordion still work.
 */
export function useHashAccordion(validIds: string[], defaultOpen = '') {
    const [openId, setOpenId] = useState<string>(defaultOpen);

    useEffect(() => {
        const applyHash = () => {
            const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
            if (!hash || !validIds.includes(hash)) return;
            setOpenId(hash);
            // Two frames so the panel has expanded (and any one-at-a-time
            // sibling collapsed) before we measure + scroll.
            requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                    document
                        .getElementById(hash)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }),
            );
        };

        applyHash();

        const origPush = window.history.pushState;
        const origReplace = window.history.replaceState;
        const emit = () => window.dispatchEvent(new Event('locationchange'));
        window.history.pushState = function (...args) {
            origPush.apply(this, args);
            emit();
        };
        window.history.replaceState = function (...args) {
            origReplace.apply(this, args);
            emit();
        };

        window.addEventListener('hashchange', applyHash);
        window.addEventListener('locationchange', applyHash);

        return () => {
            window.removeEventListener('hashchange', applyHash);
            window.removeEventListener('locationchange', applyHash);
            window.history.pushState = origPush;
            window.history.replaceState = origReplace;
        };
        // validIds is a stable module-level array; run on mount only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [openId, setOpenId] as const;
}

'use client';

import { useEffect, useState } from 'react';

/**
 * Accordion open-state synced to the URL hash so the left-rail sub-nav can
 * deep-link straight to a section — e.g. visiting `/market-indicators#trend`
 * (or clicking it in the sidebar while already on the page) opens the Trend
 * category and scrolls it into view.
 *
 * `validIds` is expected to be a stable, module-level list (the category ids).
 * Returns the same `[openId, setOpenId]` tuple as a plain useState so callers
 * are a drop-in replacement; manual clicks on the accordion still work.
 */
export function useHashAccordion(validIds: string[], defaultOpen = '') {
    const [openId, setOpenId] = useState<string>(defaultOpen);

    useEffect(() => {
        const applyHash = () => {
            const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
            if (!hash || !validIds.includes(hash)) return;
            setOpenId(hash);
            // Wait a frame so the panel has expanded before scrolling to it.
            requestAnimationFrame(() => {
                document
                    .getElementById(hash)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        };

        applyHash();
        window.addEventListener('hashchange', applyHash);
        return () => window.removeEventListener('hashchange', applyHash);
        // validIds is a stable module-level array; run on mount + hashchange only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [openId, setOpenId] as const;
}

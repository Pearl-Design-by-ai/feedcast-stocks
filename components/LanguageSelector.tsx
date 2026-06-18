'use client';

/**
 * Google Translate language selector — ported from the main feedcast.news app
 * (same language list and order). Self-contained for the markets app: it owns
 * the googtrans cookie + the hidden .goog-te-combo driver, and persists the
 * choice in localStorage so it re-applies on the next load. Styled with the
 * markets gray/teal tokens. See lib/loadGoogleTranslate.ts.
 */

import { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { loadGoogleTranslate } from '@/lib/loadGoogleTranslate';
import { cn } from '@/lib/utils';

// Same list and order as www.feedcast.news. The `code` values are Google
// Translate target codes (note zh-CN) written into googtrans=/en/<code>.
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'it', label: 'Italiano' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' },
    { code: 'zh-CN', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'hi', label: 'हिन्दी' },
];

const STORAGE_KEY = 'markets_language';

function readGoogTransCookie(): string {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/googtrans=\/en\/([^;/]+)/);
    return match ? match[1] : 'en';
}

function clearGoogTransCookies() {
    const expiry = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = `googtrans=; path=/; ${expiry}`;
    document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; ${expiry}`;
    const parts = window.location.hostname.split('.');
    if (parts.length > 2) {
        const parentDomain = '.' + parts.slice(-2).join('.');
        document.cookie = `googtrans=; path=/; domain=${parentDomain}; ${expiry}`;
    }
}

/** Apply the chosen language via the googtrans cookies + the hidden widget combo.
 *  element.js is injected on demand the first time a non-English language is
 *  picked; reverting to English just clears the cookies and reloads. */
async function applyGoogleTranslate(langCode: string) {
    clearGoogTransCookies();

    if (langCode === 'en') {
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (select) {
            select.value = 'en';
            select.dispatchEvent(new Event('change'));
            setTimeout(() => { clearGoogTransCookies(); window.location.reload(); }, 100);
        } else {
            window.location.reload();
        }
        return;
    }

    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;

    try {
        await loadGoogleTranslate();
    } catch {
        window.location.reload();
        return;
    }

    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    } else {
        window.location.reload();
    }
}

export function LanguageSelector({ triggerClassName }: { triggerClassName?: string } = {}) {
    const [open, setOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState('en');
    const ref = useRef<HTMLDivElement>(null);

    // Restore the saved choice on mount and re-apply it (the cookie alone won't
    // translate until element.js loads, so we drive it once here).
    useEffect(() => {
        const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || readGoogTransCookie();
        if (saved && saved !== 'en') {
            setCurrentLang(saved);
            applyGoogleTranslate(saved);
        }
    }, []);

    // Close on outside click.
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Let other components (e.g. a mobile sheet) open the panel.
    useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener('feedcast:open-translate', onOpen);
        return () => window.removeEventListener('feedcast:open-translate', onOpen);
    }, []);

    function pick(code: string) {
        setCurrentLang(code);
        try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
        applyGoogleTranslate(code);
        setOpen(false);
    }

    const currentLabel = LANGUAGES.find((l) => l.code === currentLang)?.label ?? 'English';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={cn('group rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-teal-400 md:p-2', triggerClassName)}
                title={`Language: ${currentLabel}`}
                // Keep Google Translate from rewriting our own control labels.
                translate="no"
            >
                <Globe size={18} />
            </button>

            {open && (
                <div translate="no" className="fixed right-2 top-14 z-[60] w-44 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-1">
                    <div className="border-b border-gray-800 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                        Translate
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => pick(lang.code)}
                                className={cn(
                                    'w-full px-3 py-2 text-left text-sm transition-colors',
                                    currentLang === lang.code ? 'bg-teal-400/10 font-medium text-teal-400' : 'text-gray-200 hover:bg-gray-800',
                                )}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LanguageSelector;

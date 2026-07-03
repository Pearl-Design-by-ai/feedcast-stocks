'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Back control for detail pages reached from lists (stock pages, etc.).
 * Uses real browser history when there is one, so it returns to the exact
 * list/scroll the user came from; on direct entries (deep link, search result)
 * it falls back to the given hub route instead of leaving the site.
 */
export default function BackButton({
    fallback = '/stocks',
    label = 'Back',
}: {
    fallback?: string;
    label?: string;
}) {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push(fallback);
            }}
            className="group flex w-fit items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-sm text-gray-400 transition-[color,border-color,transform] duration-150 ease-out hover:border-gray-700 hover:text-gray-200 active:scale-[0.97]"
        >
            <ArrowLeft size={15} className="transition-transform duration-150 ease-out group-hover:-translate-x-0.5" />
            {label}
        </button>
    );
}

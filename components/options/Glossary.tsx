'use client';

/** Searchable options glossary — filters the term list as you type. */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GLOSSARY } from '@/lib/options/content';

export default function Glossary() {
    const [q, setQ] = useState('');
    const list = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return GLOSSARY;
        return GLOSSARY.filter((t) => t.term.toLowerCase().includes(needle) || t.def.toLowerCase().includes(needle));
    }, [q]);

    return (
        <div>
            <div className="relative mb-4 max-w-sm">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search terms…"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder:text-gray-600 focus:border-teal-400/60 focus:outline-none"
                    aria-label="Search the glossary"
                />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                    <div key={t.term} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <p className="text-sm font-semibold text-gray-100">{t.term}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{t.def}</p>
                    </div>
                ))}
                {list.length === 0 && <p className="text-sm text-gray-500">No terms match “{q}”.</p>}
            </div>
        </div>
    );
}

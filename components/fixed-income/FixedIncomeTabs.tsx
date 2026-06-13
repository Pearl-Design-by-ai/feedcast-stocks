import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
    { href: '/fixed-income', label: 'Overview' },
    { href: '/fixed-income/corporate', label: 'Corporate & Global Credit' },
];

/** Slim tab strip splitting the dense Fixed Income area into two pages. */
export default function FixedIncomeTabs({ active }: { active: string }) {
    return (
        <div className="flex flex-wrap gap-1.5 border-b border-gray-800 pb-px">
            {TABS.map((t) => {
                const on = t.href === active;
                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        aria-current={on ? 'page' : undefined}
                        className={cn(
                            'rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
                            on
                                ? 'border-teal-400 text-teal-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        )}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}

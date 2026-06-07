'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

// The footer is only shown on the home page; other pages don't need it.
export default function HomeOnlyFooter() {
    const pathname = usePathname();
    if (pathname !== '/') return null;
    return <Footer />;
}

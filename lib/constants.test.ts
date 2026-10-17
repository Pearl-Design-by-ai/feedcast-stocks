import { describe, it, expect } from 'vitest';
import { NAV_SECTIONS, navSectionsForUser } from './constants';

const allItems = (isPowerUser: boolean) => navSectionsForUser(isPowerUser).flatMap((s) => s.items);

describe('navSectionsForUser', () => {
    it('returns the base sections unchanged for regular users', () => {
        expect(navSectionsForUser(false)).toBe(NAV_SECTIONS);
    });

    it('never marks base nav items as external', () => {
        expect(allItems(false).some((it) => it.external)).toBe(false);
    });

    it('adds the external link only for power users', () => {
        const link = allItems(true).find((it) => it.href === 'https://pf.feedcast.news');
        expect(link).toEqual({ href: 'https://pf.feedcast.news', label: 'Private', external: true });
        expect(allItems(false).find((it) => it.href === 'https://pf.feedcast.news')).toBeUndefined();
    });

    it('marks every absolute-URL item as external', () => {
        for (const it of allItems(true)) {
            expect(it.external === true).toBe(/^https?:\/\//.test(it.href));
        }
    });
});

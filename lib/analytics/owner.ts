/**
 * Who a page view belongs to. Uses the same owner check as the owner-only
 * pages (/admin, /my-stats, formerly /my-portfolio): isPowerUserEmail.
 */

import { isPowerUserEmail } from '@/lib/constants';

export interface Viewer {
    /** Stored only for signed-in visitors who haven't sent DNT / Sec-GPC. */
    userId: string | null;
    isOwner: boolean;
}

export function classifyViewer(
    user: { id: string; email?: string | null } | null | undefined,
    optOut: boolean,
): Viewer {
    if (!user) return { userId: null, isOwner: false };
    return { userId: optOut ? null : user.id, isOwner: isPowerUserEmail(user.email) };
}

/** Gate for /my-stats — the owner only. */
export function canViewStats(user: { email?: string | null } | null | undefined): boolean {
    return !!user && isPowerUserEmail(user.email);
}

/**
 * markets_page_views retention: rows older than RETENTION_DAYS are deleted by
 * the existing 5-minute cron (/api/cron/check-alerts) once a day, in the first
 * tick after 03:00 UTC.
 */

export const RETENTION_DAYS = 400;

export function isRetentionDue(now: Date): boolean {
    return now.getUTCHours() === 3 && now.getUTCMinutes() < 5;
}

export function retentionCutoff(now: Date): string {
    return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

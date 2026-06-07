/**
 * Thin client for Feedcast's transactional email service.
 *
 * Feedcast owns the actual email provider integration; this module just POSTs
 * a template-render request to the Feedcast send endpoint. The `stock_alert`
 * template (subject + branded HTML) lives in Feedcast's shared
 * `email_templates` table — see supabase/seed/stock_alert_email_template.sql.
 *
 * Configured via two server-only env vars:
 *   FEEDCAST_EMAIL_ENDPOINT  POST URL of the Feedcast send endpoint
 *   FEEDCAST_EMAIL_SECRET    bearer token the endpoint expects
 *
 * When either is unset the sender is a silent no-op, so price alerts keep
 * working (they just won't email) until the integration is wired up.
 */

export type StockAlertEmailVars = {
    to: string;
    symbol: string;
    alertName: string;
    conditionText: string;
    targetPrice: string;
    currentPrice: string;
    watchlistUrl: string;
};

export function isFeedcastEmailConfigured(): boolean {
    return Boolean(process.env.FEEDCAST_EMAIL_ENDPOINT && process.env.FEEDCAST_EMAIL_SECRET);
}

/**
 * Sends one `stock_alert` email via Feedcast. Returns true only on a 2xx
 * response so the caller can mark the alert notified (and retry otherwise).
 */
export async function sendStockAlertEmail(vars: StockAlertEmailVars): Promise<boolean> {
    const endpoint = process.env.FEEDCAST_EMAIL_ENDPOINT;
    const secret = process.env.FEEDCAST_EMAIL_SECRET;
    if (!endpoint || !secret) return false;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${secret}`,
            },
            cache: 'no-store',
            body: JSON.stringify({
                to: vars.to,
                template_key: 'stock_alert',
                variables: {
                    symbol: vars.symbol,
                    alertName: vars.alertName,
                    conditionText: vars.conditionText,
                    targetPrice: vars.targetPrice,
                    currentPrice: vars.currentPrice,
                    watchlistUrl: vars.watchlistUrl,
                },
            }),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error('feedcast-email: send failed', res.status, body.slice(0, 200));
            return false;
        }
        return true;
    } catch (err) {
        console.error('feedcast-email: send error', err);
        return false;
    }
}

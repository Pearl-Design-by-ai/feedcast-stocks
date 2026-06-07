# Feedcast Markets

**Feedcast Markets** is the market-tracking module of [Feedcast](https://www.feedcast.news),
served at **markets.feedcast.news**. It lets members track real-time stock
prices, build a watchlist, set price alerts, and explore detailed company
insights through embedded TradingView widgets.

---

## Credit & License

Feedcast Markets is a **derivative work of [OpenStock](https://github.com/Open-Dev-Society/OpenStock)**,
an open-source market platform created by **[Open Dev Society](https://github.com/Open-Dev-Society)**.

Huge thanks to the OpenStock authors and contributors — this project would
not exist without their work. Please visit and star the original:

> 🔗 **Original project: https://github.com/Open-Dev-Society/OpenStock**

This project is licensed under the **GNU Affero General Public License v3.0
(AGPL-3.0)**, the same license as OpenStock. The full license text is in the
[`LICENSE`](./LICENSE) file and is unchanged from the upstream project.

Under the AGPL-3.0, the complete corresponding source code of this modified
version is made available to all users who interact with it over a network.

### What changed from upstream OpenStock

This is a **modified version of OpenStock**, first created on **2026-05-18**
and maintained by **FeedCast** (Pearl Design). Per AGPL-3.0 §5(a), this notice
records that the work has been modified; see the git history for the dated
record of every change.

It re-platforms OpenStock onto the Feedcast stack:

| Area            | OpenStock                     | Feedcast Markets                          |
| --------------- | ----------------------------- | ---------------------------------------- |
| Authentication  | Better Auth                   | Supabase Auth (shared Feedcast SSO)      |
| Database        | MongoDB + Mongoose            | Supabase Postgres                        |
| Background jobs | Inngest                       | Cloudflare Cron Worker                   |
| Email           | Nodemailer                    | _(removed — handled by Feedcast)_        |
| Hosting         | Node / Vercel                 | Cloudflare Workers via OpenNext          |

The watchlist and alerts logic, TradingView integration, Finnhub data layer
and UI are substantially the same as upstream.

---

## Tech stack

- Next.js 15.5.7 (App Router) / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres) — shared Feedcast project
- Finnhub API for market data
- Cloudflare Workers (OpenNext adapter) for hosting + cron

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Quality checks

```bash
npm run lint        # ESLint (next/core-web-vitals)
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests
```

These three run on every pull request and non-`main` push via
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

### Environment variables

| Variable                        | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL (shared Feedcast project)       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase service-role key (cron + admin lookups)     |
| `FINNHUB_API_KEY`                | Finnhub market-data API key (server-only)            |
| `CRON_SECRET`                    | Bearer secret for `POST /api/cron/check-alerts`      |
| `FEEDCAST_EMAIL_ENDPOINT`        | Optional — Feedcast email endpoint for alert emails  |
| `FEEDCAST_EMAIL_SECRET`          | Optional — bearer token for the email endpoint       |
| `ADANOS_API_KEY`                 | Optional — enables the stock sentiment card          |
| `ADANOS_API_BASE_URL`            | Optional — Adanos API base URL                       |

### Database

The `stock_watchlist` and `stock_alerts` tables live in the shared Feedcast
Supabase project. The schema is documented in
[`supabase/migrations/`](./supabase/migrations/) — `001` creates the tables,
`002` adds the optional alert `name`, and `003` adds `notified_at` (alert-email
dedupe).

### Alert emails

When a price alert triggers, the 5-minute cron emails the alert owner via
Feedcast's transactional email service. It POSTs a template-render request to
`FEEDCAST_EMAIL_ENDPOINT` (bearer `FEEDCAST_EMAIL_SECRET`):

```json
{
  "to": "user@example.com",
  "template_key": "stock_alert",
  "variables": {
    "symbol": "AAPL",
    "alertName": "Apple at a discount",
    "conditionText": "rose to or above",
    "targetPrice": "$180.00",
    "currentPrice": "$182.40",
    "watchlistUrl": "https://markets.feedcast.news/watchlist"
  }
}
```

The branded `stock_alert` template lives in Feedcast's shared `email_templates`
table — see [`supabase/seed/stock_alert_email_template.sql`](./supabase/seed/stock_alert_email_template.sql).
`notified_at` is stamped only on a successful 2xx, so a failed send retries on
the next run and nobody is emailed twice. If the two env vars are unset, alerts
still trigger — they just don't email.

## Deployment

Deployed to Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare)
adapter at `markets.feedcast.news`. A separate `feedcast-stocks-cron` Worker
fires every 5 minutes to evaluate price alerts.

```bash
npm run deploy   # opennextjs-cloudflare build + wrangler deploy
```

CI deploys both the app worker and the cron worker on every push to `main`
(see [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)).

---

_Built on OpenStock by Open Dev Society. AGPL-3.0._

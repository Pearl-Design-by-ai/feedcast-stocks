# Feedcast Stocks

**Feedcast Stocks** is the market-tracking module of [Feedcast](https://www.feedcast.news),
served at **stocks.feedcast.news**. It lets members track real-time stock
prices, build a watchlist, set price alerts, and explore detailed company
insights through embedded TradingView widgets.

---

## Credit & License

Feedcast Stocks is a **derivative work of [OpenStock](https://github.com/Open-Dev-Society/OpenStock)**,
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

This fork re-platforms OpenStock onto the Feedcast stack:

| Area            | OpenStock                     | Feedcast Stocks                          |
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

### Environment variables

| Variable                        | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL (shared Feedcast project)       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase service-role key (cron + admin lookups)     |
| `FINNHUB_API_KEY`                | Finnhub market-data API key (server-only)            |
| `CRON_SECRET`                    | Bearer secret for `POST /api/cron/check-alerts`      |
| `ADANOS_API_KEY`                 | Optional — enables the stock sentiment card          |
| `ADANOS_API_BASE_URL`            | Optional — Adanos API base URL                       |

### Database

The `stock_watchlist` and `stock_alerts` tables live in the shared Feedcast
Supabase project. The schema is documented in
[`supabase/migrations/001_stock_module_tables.sql`](./supabase/migrations/001_stock_module_tables.sql).

## Deployment

Deployed to Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare)
adapter at `stocks.feedcast.news`. A separate `feedcast-stocks-cron` Worker
fires every 5 minutes to evaluate price alerts.

```bash
npm run deploy   # opennextjs-cloudflare build + wrangler deploy
```

CI deploys both the app worker and the cron worker on every push to `main`
(see [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)).

---

_Built on OpenStock by Open Dev Society. AGPL-3.0._

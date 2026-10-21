-- First-party, cookieless page-view counting for FeedCast Markets.
-- Written by POST /api/a (service role), read by the owner-only /my-stats page
-- (service role). No IPs or full user agents are stored: visitor_hash is a
-- 16-hex SHA-256 of a daily-rotating salt + IP + UA (null under DNT / Sec-GPC).
-- Additive only.

create table if not exists public.markets_page_views (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  path text,
  referrer_host text,
  country text,
  device text,
  visitor_hash text,
  user_id uuid null references auth.users(id) on delete set null,
  is_owner boolean not null default false,
  is_bot boolean not null default false
);

create index if not exists markets_page_views_created_at_idx
  on public.markets_page_views (created_at);
create index if not exists markets_page_views_visitor_hash_created_at_idx
  on public.markets_page_views (visitor_hash, created_at);

-- Service role only: no anon / authenticated grants, RLS on with NO policies.
revoke all on public.markets_page_views from anon, authenticated;
grant select, insert, delete on public.markets_page_views to service_role;
grant usage, select on sequence public.markets_page_views_id_seq to service_role;

alter table public.markets_page_views enable row level security;

-- Retention: rows older than 400 days are deleted once a day by the app's
-- existing cron (/api/cron/check-alerts, driven by the feedcast-stocks-cron
-- Worker; see lib/analytics/retention.ts). pg_cron is installed on this
-- project, so an equivalent database-side job would be:
--
--   select cron.schedule('markets-page-views-retention', '15 3 * * *',
--     $$delete from public.markets_page_views where created_at < now() - interval '400 days'$$);

-- 001_stock_module_tables.sql
--
-- Feedcast Stocks module tables. These tables already exist in the
-- shared Feedcast Supabase project (ref `zaoqirzyqlhgegpxelqo`); this
-- migration documents the schema for repo completeness and lets a fresh
-- project be bootstrapped with `supabase db push`.
--
-- New `public` tables must ship explicit GRANTs — Supabase removes the
-- default Data API exposure of `public` (existing project deadline:
-- 2026-10-30). Without the GRANT block below, supabase-js / REST return
-- PostgREST `42501`. See supabase/migrations/README.md.

-- ---------------------------------------------------------------------
-- stock_watchlist — one row per (user, symbol) the user is tracking.
-- ---------------------------------------------------------------------
create table if not exists public.stock_watchlist (
  id        bigserial primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  symbol    text not null,
  company   text not null,
  added_at  timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists stock_watchlist_user_id_idx
  on public.stock_watchlist (user_id);

-- anon has no access — watchlists are private.
grant select, insert, update, delete on public.stock_watchlist to authenticated;
grant select, insert, update, delete on public.stock_watchlist to service_role;
grant usage, select on sequence public.stock_watchlist_id_seq to authenticated;
grant usage, select on sequence public.stock_watchlist_id_seq to service_role;

alter table public.stock_watchlist enable row level security;

create policy "owners read stock_watchlist"
  on public.stock_watchlist for select to authenticated
  using (auth.uid() = user_id);

create policy "owners insert stock_watchlist"
  on public.stock_watchlist for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owners update stock_watchlist"
  on public.stock_watchlist for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owners delete stock_watchlist"
  on public.stock_watchlist for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- stock_alerts — price alerts. The cron Worker marks `triggered = true`
-- via the service-role client when the condition is met.
-- ---------------------------------------------------------------------
create table if not exists public.stock_alerts (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  symbol        text not null,
  target_price  numeric not null,
  condition     text not null check (condition in ('ABOVE', 'BELOW')),
  active        boolean not null default true,
  triggered     boolean not null default false,
  expires_at    timestamptz not null default (now() + interval '90 days'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists stock_alerts_user_id_idx
  on public.stock_alerts (user_id);
create index if not exists stock_alerts_active_idx
  on public.stock_alerts (active, triggered, expires_at);

-- anon has no access — alerts are private.
grant select, insert, update, delete on public.stock_alerts to authenticated;
grant select, insert, update, delete on public.stock_alerts to service_role;
grant usage, select on sequence public.stock_alerts_id_seq to authenticated;
grant usage, select on sequence public.stock_alerts_id_seq to service_role;

alter table public.stock_alerts enable row level security;

create policy "owners read stock_alerts"
  on public.stock_alerts for select to authenticated
  using (auth.uid() = user_id);

create policy "owners insert stock_alerts"
  on public.stock_alerts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owners update stock_alerts"
  on public.stock_alerts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owners delete stock_alerts"
  on public.stock_alerts for delete to authenticated
  using (auth.uid() = user_id);

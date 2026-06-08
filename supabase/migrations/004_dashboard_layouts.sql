-- Per-user customizable dashboard layout for FeedCast Markets.
-- Stores the ordered list of modules (with width) the user pinned to their home
-- page. One row per user; the layout itself is a JSONB blob:
--   { "tiles": [ { "id": "market-overview", "span": "full" }, ... ] }

create table if not exists public.markets_dashboard_layouts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  layout     jsonb not null default '{"tiles":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Data API exposure must be granted explicitly (Supabase drops the default for
-- existing projects on 2026-10-30 — see README).
grant select, insert, update, delete on public.markets_dashboard_layouts to authenticated;
grant select, insert, update, delete on public.markets_dashboard_layouts to service_role;

alter table public.markets_dashboard_layouts enable row level security;

create policy "owners read markets_dashboard_layouts"
  on public.markets_dashboard_layouts for select to authenticated
  using (auth.uid() = user_id);

create policy "owners insert markets_dashboard_layouts"
  on public.markets_dashboard_layouts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owners update markets_dashboard_layouts"
  on public.markets_dashboard_layouts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

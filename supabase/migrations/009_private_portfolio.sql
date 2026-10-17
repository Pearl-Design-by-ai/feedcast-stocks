-- Owner-only private portfolio documents (/my-portfolio).
--
-- One row per synced document: kind='snapshot' (slug 'current' = the latest
-- synced portfolio) or kind='plan' (one row per proposal). Rows are written
-- ONLY by the off-repo sync script with the service_role key; the app reads
-- them server-side with the signed-in user's session, so RLS limits every
-- reader to their own rows and there are no insert/update/delete policies.

create table if not exists public.private_portfolio_documents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('snapshot', 'plan')),
  slug text not null,
  as_of timestamptz not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, kind, slug)
);

alter table public.private_portfolio_documents enable row level security;
alter table public.private_portfolio_documents force row level security;

create policy "owner reads own private portfolio documents" on public.private_portfolio_documents
  for select to authenticated using (auth.uid() = user_id);

revoke all on table public.private_portfolio_documents from anon, authenticated;
grant select on table public.private_portfolio_documents to authenticated;
-- Explicit grant for the sync script (see migrations/README.md: new public
-- tables need explicit grants once default Data API exposure is removed).
grant select, insert, update, delete on table public.private_portfolio_documents to service_role;

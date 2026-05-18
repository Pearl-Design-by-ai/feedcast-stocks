# Migration conventions

## New tables in `public` must include explicit GRANTs

Supabase is removing the default Data API exposure of `public` tables. For
the shared Feedcast project (`zaoqirzyqlhgegpxelqo`) the deadline is
**2026-10-30**. After that, any new `public` table without an explicit
`GRANT` returns PostgREST `42501` to `supabase-js`, REST and GraphQL.

## Template

Every new migration that creates a `public` table must end with the grant +
RLS block. Decide per table whether `anon` gets `SELECT`; `authenticated`
and `service_role` are almost always needed.

```sql
create table if not exists public.your_table (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Pick ONE of the two anon lines:
grant select on public.your_table to anon;            -- publicly readable
-- (omit the line entirely if anon should have no access)

grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;

alter table public.your_table enable row level security;

create policy "owners read"
  on public.your_table for select to authenticated
  using (auth.uid() = user_id);
```

## Other notes

- Migrations are numbered `NNN_description.sql`, applied in order.
- The `stock_watchlist` / `stock_alerts` tables already exist in the shared
  Feedcast Supabase project — `001_stock_module_tables.sql` documents them
  for repo completeness and is idempotent (`create table if not exists`).
- After a schema change, run `get_advisors` to surface missing RLS policies.

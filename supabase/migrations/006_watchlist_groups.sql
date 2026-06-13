-- Multiple named watchlists per user (up to 5). Existing flat lists migrate
-- into a default "My Watchlist" group; the same symbol may now live in
-- different groups, so uniqueness moves to (group_id, symbol).

create table if not exists public.stock_watchlist_groups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stock_watchlist_groups enable row level security;

drop policy if exists "owners manage watchlist_groups" on public.stock_watchlist_groups;
create policy "owners manage watchlist_groups" on public.stock_watchlist_groups
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on public.stock_watchlist_groups to service_role;
grant select, insert, update, delete on public.stock_watchlist_groups to authenticated;

create or replace function public.enforce_watchlist_group_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.stock_watchlist_groups where user_id = new.user_id) >= 5 then
    raise exception 'You can have at most 5 watchlists.';
  end if;
  return new;
end $$;

drop trigger if exists trg_watchlist_group_limit on public.stock_watchlist_groups;
create trigger trg_watchlist_group_limit
  before insert on public.stock_watchlist_groups
  for each row execute function public.enforce_watchlist_group_limit();

alter table public.stock_watchlist
  add column if not exists group_id bigint references public.stock_watchlist_groups(id) on delete cascade;

do $$
declare u record; gid bigint;
begin
  for u in select distinct user_id from public.stock_watchlist where group_id is null loop
    insert into public.stock_watchlist_groups(user_id, name, position)
      values (u.user_id, 'My Watchlist', 0) returning id into gid;
    update public.stock_watchlist set group_id = gid where user_id = u.user_id and group_id is null;
  end loop;
end $$;

alter table public.stock_watchlist drop constraint if exists stock_watchlist_user_id_symbol_key;
alter table public.stock_watchlist add constraint stock_watchlist_group_symbol_key unique (group_id, symbol);
create index if not exists idx_stock_watchlist_group on public.stock_watchlist (group_id);

-- Power users get unlimited watchlists; everyone else stays capped at 5.
-- Redefine the insert-limit trigger to look up the inserting user's email and
-- skip the cap for the power-user allowlist. Keep this list in sync with
-- POWER_USER_EMAILS in lib/constants.ts.

create or replace function public.enforce_watchlist_group_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select lower(email) into v_email from auth.users where id = new.user_id;
  if v_email = any (array['altuginci@gmail.com']) then
    return new; -- power user: unlimited watchlists
  end if;
  if (select count(*) from public.stock_watchlist_groups where user_id = new.user_id) >= 5 then
    raise exception 'You can have at most 5 watchlists.';
  end if;
  return new;
end $$;

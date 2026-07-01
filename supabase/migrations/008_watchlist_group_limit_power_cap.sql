-- Power users are no longer unlimited: cap them at 100 watchlists instead of 5.
-- Standard users stay at 5. Keep the allowlist in sync with POWER_USER_EMAILS
-- in lib/constants.ts and the caps with MAX_GROUPS / MAX_GROUPS_POWER.

create or replace function public.enforce_watchlist_group_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_cap int;
begin
  select lower(email) into v_email from auth.users where id = new.user_id;
  v_cap := case when v_email = any (array['altuginci@gmail.com']) then 100 else 5 end;
  if (select count(*) from public.stock_watchlist_groups where user_id = new.user_id) >= v_cap then
    raise exception 'You can have at most % watchlists.', v_cap;
  end if;
  return new;
end $$;

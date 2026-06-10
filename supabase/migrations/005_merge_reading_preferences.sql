-- Atomic merge for user_preferences.reading_preferences.
--
-- The appearance page (and the main Feedcast app) both write keys into this
-- JSONB. A read-merge-write in application code can lose a concurrent
-- writer's key (e.g. accent saved while a background tone save is in
-- flight). This function merges server-side in one statement instead.
--
-- SECURITY INVOKER: runs with the caller's rights, so the existing RLS
-- policies on user_preferences (own-row insert/update) still apply.

create or replace function public.merge_reading_preferences(prefs jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.user_preferences as up (id, reading_preferences)
  values (auth.uid(), prefs)
  on conflict (id) do update
    set reading_preferences =
          coalesce(up.reading_preferences, '{}'::jsonb) || excluded.reading_preferences,
        updated_at = now();
$$;

revoke all on function public.merge_reading_preferences(jsonb) from public, anon;
grant execute on function public.merge_reading_preferences(jsonb) to authenticated;

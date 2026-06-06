-- 003_stock_alerts_notified_at.sql
--
-- Tracks when an alert's "your price target was hit" email was sent, so the
-- 5-minute cron never emails the same triggered alert twice and can safely
-- retry a previously-failed send on the next run.
--
-- Additive and nullable: NULL means "triggered but not yet emailed" (or never
-- triggered). Existing rows keep working unchanged.

alter table public.stock_alerts
  add column if not exists notified_at timestamptz;

-- Lets the cron cheaply find triggered alerts still awaiting an email.
create index if not exists stock_alerts_pending_notify_idx
  on public.stock_alerts (id)
  where triggered = true and notified_at is null;

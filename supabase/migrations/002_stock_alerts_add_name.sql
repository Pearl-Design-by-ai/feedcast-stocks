-- 002_stock_alerts_add_name.sql
--
-- Adds an optional, user-supplied label to price alerts so members can name
-- an alert (e.g. "Apple at a discount"). Additive and nullable — existing
-- rows and inserts that omit `name` keep working unchanged.

alter table public.stock_alerts
  add column if not exists name text;

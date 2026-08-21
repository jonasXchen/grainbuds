-- ============================================================
-- Grainbuds RESET — run this ONLY when grainbuds_* tables already
-- exist from an earlier version of schema.sql and you want a clean
-- re-install. It deletes all Grainbuds tables AND THEIR DATA
-- (menu, orders, mailing list, staff list).
--
-- Flow: reset.sql → schema.sql → seed.sql
--
-- It only touches grainbuds_* objects and this project's storage
-- policies — other apps' tables in the same Supabase project are
-- not affected.
-- ============================================================

-- Tables (cascade removes their policies, triggers, and indexes)
drop table if exists grainbuds_order_items cascade;
drop table if exists grainbuds_orders cascade;
drop table if exists grainbuds_products cascade;
drop table if exists grainbuds_categories cascade;
drop table if exists grainbuds_subscribers cascade;
drop table if exists grainbuds_settings cascade;
drop table if exists grainbuds_staff cascade;

-- Functions
drop function if exists public.grainbuds_handle_order_item_stock() cascade;
drop function if exists public.grainbuds_order_confirmation(uuid);
drop function if exists public.grainbuds_update_order_details(uuid, text, text, text, text, text);
drop function if exists public.grainbuds_is_staff() cascade;

-- Storage policies (the bucket itself is kept; schema.sql re-creates
-- the policies, and "on conflict do nothing" handles the bucket)
drop policy if exists "public read product images" on storage.objects;
drop policy if exists "staff upload product images" on storage.objects;
drop policy if exists "staff update product images" on storage.objects;
drop policy if exists "staff delete product images" on storage.objects;

-- Done. Now run schema.sql, then seed.sql, then re-add staff
-- (README → "Create the owner's login").

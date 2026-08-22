-- Count QR scans and attribute completed checkouts to the same campaign.
-- Scan rows intentionally contain no IP address or other customer identifier.
alter table public.grainbuds_orders
  add column if not exists qr_campaign text;

alter table public.grainbuds_orders
  drop constraint if exists grainbuds_orders_qr_campaign_check;

alter table public.grainbuds_orders
  add constraint grainbuds_orders_qr_campaign_check
    check (qr_campaign is null or qr_campaign ~ '^[a-z0-9-]{1,60}$');

create table if not exists public.grainbuds_qr_scans (
  id bigint generated always as identity primary key,
  campaign text not null check (campaign ~ '^[a-z0-9-]{1,60}$'),
  qr_kind text not null check (qr_kind in ('online', 'table')),
  table_number smallint check (table_number between 1 and 999),
  destination_path text not null check (char_length(destination_path) <= 500),
  scanned_at timestamptz not null default now()
);

create index if not exists grainbuds_qr_scans_campaign_idx
  on public.grainbuds_qr_scans (campaign, scanned_at desc);

alter table public.grainbuds_qr_scans enable row level security;

drop policy if exists "public record grainbuds qr scans" on public.grainbuds_qr_scans;
create policy "public record grainbuds qr scans" on public.grainbuds_qr_scans
  for insert with check (true);

drop policy if exists "staff read grainbuds qr scans" on public.grainbuds_qr_scans;
create policy "staff read grainbuds qr scans" on public.grainbuds_qr_scans
  for select to authenticated using (public.grainbuds_is_staff());

create or replace function public.grainbuds_order_confirmation(order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'customer_phone', o.customer_phone,
    'pickup_time', o.pickup_time,
    'fulfillment_type', o.fulfillment_type,
    'table_number', o.table_number,
    'order_source', o.order_source,
    'qr_campaign', o.qr_campaign,
    'notes', o.notes,
    'status', o.status,
    'total_cents', o.total_cents,
    'created_at', o.created_at,
    'order_items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'product_name', i.product_name,
        'unit_price_cents', i.unit_price_cents,
        'quantity', i.quantity
      ))
      from public.grainbuds_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.grainbuds_orders o where o.id = order_id;
$$;

revoke all on function public.grainbuds_order_confirmation(uuid) from public;
grant execute on function public.grainbuds_order_confirmation(uuid) to anon, authenticated;

create or replace function public.grainbuds_qr_campaign_stats()
returns table (
  campaign text,
  scans bigint,
  orders bigint,
  last_scan timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with scan_totals as (
    select s.campaign, count(*)::bigint as scans, max(s.scanned_at) as last_scan
    from public.grainbuds_qr_scans s
    group by s.campaign
  ), order_totals as (
    select o.qr_campaign as campaign, count(*)::bigint as orders
    from public.grainbuds_orders o
    where o.qr_campaign is not null and o.status <> 'cancelled'
    group by o.qr_campaign
  )
  select coalesce(s.campaign, o.campaign),
         coalesce(s.scans, 0),
         coalesce(o.orders, 0),
         s.last_scan
  from scan_totals s
  full outer join order_totals o using (campaign)
  where public.grainbuds_is_staff()
  order by coalesce(s.scans, 0) desc, coalesce(o.orders, 0) desc;
$$;

revoke all on function public.grainbuds_qr_campaign_stats() from public;
grant execute on function public.grainbuds_qr_campaign_stats() to authenticated;

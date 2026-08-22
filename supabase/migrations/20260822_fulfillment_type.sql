-- Add pickup/dine-in fulfillment without resetting existing orders.
-- Delivery remains a disabled preview in the UI and is not accepted here yet.
alter table public.grainbuds_orders
  add column if not exists fulfillment_type text not null default 'pickup';

alter table public.grainbuds_orders
  drop constraint if exists grainbuds_orders_fulfillment_type_check;

alter table public.grainbuds_orders
  add constraint grainbuds_orders_fulfillment_type_check
  check (fulfillment_type in ('pickup', 'dine_in'));

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

create or replace function public.grainbuds_update_order_details(
  p_order_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_pickup_time text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if btrim(coalesce(p_customer_name, '')) = ''
     or btrim(coalesce(p_customer_email, '')) = '' then
    return null;
  end if;

  update public.grainbuds_orders o
  set customer_name = left(btrim(p_customer_name), 120),
      customer_email = left(lower(btrim(p_customer_email)), 200),
      customer_phone = nullif(left(btrim(coalesce(p_customer_phone, '')), 40), ''),
      pickup_time = nullif(left(btrim(coalesce(p_pickup_time, '')), 80), ''),
      notes = nullif(left(btrim(coalesce(p_notes, '')), 500), '')
  where o.id = p_order_id
    and o.status in ('new', 'in_progress');

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'customer_phone', o.customer_phone,
    'pickup_time', o.pickup_time,
    'fulfillment_type', o.fulfillment_type,
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
  ) into result
  from public.grainbuds_orders o
  where o.id = p_order_id;

  return result;
end;
$$;

revoke all on function public.grainbuds_update_order_details(uuid, text, text, text, text, text) from public;
grant execute on function public.grainbuds_update_order_details(uuid, text, text, text, text, text) to anon, authenticated;

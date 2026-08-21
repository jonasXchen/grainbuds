-- ============================================================
-- Grainbuds database — complete setup, run ONCE on a fresh project.
-- Supabase dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the menu.
--
-- Covers: product catalog + inventory, grainbuds_orders + payment history,
-- customer data + mailing list, image storage, and all security rules.
-- Staff logins are managed in Supabase Auth (see README), not here.
-- ============================================================

-- ============ Catalog ============

create table grainbuds_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_de text not null default '',
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table grainbuds_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references grainbuds_categories(id) on delete set null,
  name text not null,
  name_de text not null default '',
  slug text not null unique,
  description text not null default '',
  description_de text not null default '',
  price_cents int not null check (price_cents >= 0),
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  -- Inventory: null = not tracked (made to order); 0 = sold out.
  stock int check (stock >= 0),
  created_at timestamptz not null default now()
);

create index grainbuds_products_category_idx on grainbuds_products (category_id);

-- ============ Orders & payment history ============

create table grainbuds_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  pickup_time text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'ready', 'completed', 'cancelled')),
  total_cents int not null default 0 check (total_cents >= 0),
  -- Payment happens in store; staff record it here.
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  payment_method text
    check (payment_method in ('cash', 'card')),
  paid_at timestamptz,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create index grainbuds_orders_created_idx on grainbuds_orders (created_at desc);
create index grainbuds_orders_status_idx on grainbuds_orders (status);
create index grainbuds_orders_email_idx on grainbuds_orders (lower(customer_email));

create table grainbuds_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references grainbuds_orders(id) on delete cascade,
  product_id uuid references grainbuds_products(id) on delete set null,
  product_name text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity > 0 and quantity <= 20),
  notes text
);

create index grainbuds_order_items_order_idx on grainbuds_order_items (order_id);
create index grainbuds_order_items_product_idx on grainbuds_order_items (product_id);

-- ============ Customer data: mailing list ============
-- Only people who explicitly opted in at checkout. Customer purchase
-- history lives in grainbuds_orders (aggregated by email in the admin panel).

create table grainbuds_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text not null default 'checkout',
  created_at timestamptz not null default now()
);

-- Staff-managed application settings. Values are JSON so additional settings
-- can be added without another schema change. Never expose this table to anon.
create table grainbuds_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============ Staff allowlist ============
-- Being a logged-in user of this Supabase project is NOT enough to manage
-- Grainbuds — only accounts listed here count as staff. This keeps other
-- apps' users in the same project away from grainbuds_* tables entirely.
--
-- There are deliberately NO write policies on this table: rows can only be
-- added or removed in the SQL Editor (see README), never through the API.

create table grainbuds_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table grainbuds_staff enable row level security;

-- Used by every staff policy below. SECURITY DEFINER so the check itself
-- isn't blocked by RLS; returns false for anonymous and non-staff users.
create or replace function public.grainbuds_is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from grainbuds_staff where user_id = auth.uid()
  );
$$;

grant execute on function public.grainbuds_is_staff() to anon, authenticated;

create policy "staff read staff list" on grainbuds_staff
  for select to authenticated using (public.grainbuds_is_staff());

-- ============ Row Level Security ============

alter table grainbuds_categories enable row level security;
alter table grainbuds_products enable row level security;
alter table grainbuds_orders enable row level security;
alter table grainbuds_order_items enable row level security;
alter table grainbuds_subscribers enable row level security;
alter table grainbuds_settings enable row level security;

-- Anyone can browse grainbuds_categories and live grainbuds_products.
create policy "public read grainbuds_categories" on grainbuds_categories
  for select using (true);
create policy "public read active grainbuds_products" on grainbuds_products
  for select using (is_active = true);

-- Signed-in staff manage the catalog.
create policy "staff read all grainbuds_products" on grainbuds_products
  for select to authenticated using (public.grainbuds_is_staff());
create policy "staff write grainbuds_products" on grainbuds_products
  for all to authenticated using (public.grainbuds_is_staff()) with check (public.grainbuds_is_staff());
create policy "staff write grainbuds_categories" on grainbuds_categories
  for all to authenticated using (public.grainbuds_is_staff()) with check (public.grainbuds_is_staff());

-- Customers (anonymous) can place grainbuds_orders but never list or read them back
-- directly — the confirmation page uses grainbuds_order_confirmation() below,
-- which requires knowing the exact unguessable order id.
create policy "public create grainbuds_orders" on grainbuds_orders
  for insert with check (true);
create policy "public create order items" on grainbuds_order_items
  for insert with check (true);

-- Staff manage grainbuds_orders.
create policy "staff read grainbuds_orders" on grainbuds_orders
  for select to authenticated using (public.grainbuds_is_staff());
create policy "staff update grainbuds_orders" on grainbuds_orders
  for update to authenticated using (public.grainbuds_is_staff()) with check (public.grainbuds_is_staff());
create policy "staff delete grainbuds_orders" on grainbuds_orders
  for delete to authenticated using (public.grainbuds_is_staff());
create policy "staff read order items" on grainbuds_order_items
  for select to authenticated using (public.grainbuds_is_staff());

-- Customers may join the mailing list; only staff can read or manage it.
create policy "public join grainbuds_subscribers" on grainbuds_subscribers
  for insert with check (true);
create policy "staff read grainbuds_subscribers" on grainbuds_subscribers
  for select to authenticated using (public.grainbuds_is_staff());
create policy "staff delete grainbuds_subscribers" on grainbuds_subscribers
  for delete to authenticated using (public.grainbuds_is_staff());

-- Notification recipients and future settings are visible only to staff.
create policy "staff read grainbuds_settings" on grainbuds_settings
  for select to authenticated using (public.grainbuds_is_staff());
create policy "staff write grainbuds_settings" on grainbuds_settings
  for all to authenticated using (public.grainbuds_is_staff()) with check (public.grainbuds_is_staff());

-- Public homepage access to the single safe Instagram gallery setting without
-- exposing email recipients or future private settings.
create or replace function public.grainbuds_get_instagram_gallery()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select value from public.grainbuds_settings where key = 'instagram_gallery' limit 1;
$$;

revoke all on function public.grainbuds_get_instagram_gallery() from public;
grant execute on function public.grainbuds_get_instagram_gallery() to anon, authenticated;

-- ============ Inventory guard ============
-- Decrements stock when an order item is placed. Runs with owner
-- privileges so anonymous checkouts can decrement stock, and refuses
-- the sale if not enough is left — no overselling, even with two
-- customers checking out at the same moment.

create or replace function public.grainbuds_handle_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update grainbuds_products
      set stock = stock - new.quantity
      where id = new.product_id and stock is not null;
    if exists (
      select 1 from grainbuds_products where id = new.product_id and stock < 0
    ) then
      raise exception 'insufficient stock for product %', new.product_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger order_item_stock
  before insert on grainbuds_order_items
  for each row execute function public.grainbuds_handle_order_item_stock();

-- ============ Order confirmation lookup ============
-- Returns one order by exact id, and only the fields the confirmation
-- page shows (no email, phone, or kitchen notes). Orders can never be
-- listed with the public key.

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
      from grainbuds_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from grainbuds_orders o where o.id = order_id;
$$;

grant execute on function public.grainbuds_order_confirmation(uuid) to anon, authenticated;

-- Public queue totals reveal no customer or order details. Checkout uses the
-- snapshot to estimate a position and drink preparation time (30s per drink).
create or replace function public.grainbuds_queue_snapshot()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'active_orders', (
      select count(*)
      from grainbuds_orders o
      where o.status in ('new', 'in_progress')
    ),
    'queued_drinks', (
      select coalesce(sum(i.quantity), 0)
      from grainbuds_order_items i
      join grainbuds_orders o on o.id = i.order_id
      join grainbuds_products p on p.id = i.product_id
      join grainbuds_categories c on c.id = p.category_id
      where o.status in ('new', 'in_progress')
        and c.slug in (
          'specialty-matcha',
          'matcha-refresher',
          'hojicha',
          'smoothies',
          'fruit-tea',
          'fruit-cloud',
          'tapioca-boba'
        )
    )
  );
$$;

revoke all on function public.grainbuds_queue_snapshot() from public;
grant execute on function public.grainbuds_queue_snapshot() to anon, authenticated;

-- The order URL contains an unguessable UUID and acts as the customer's edit
-- capability. Customers can update pickup/contact details while work has not
-- progressed beyond "in progress". Product lines and totals remain immutable.
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

  update grainbuds_orders o
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
      from grainbuds_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) into result
  from grainbuds_orders o
  where o.id = p_order_id;

  return result;
end;
$$;

revoke all on function public.grainbuds_update_order_details(uuid, text, text, text, text, text) from public;
grant execute on function public.grainbuds_update_order_details(uuid, text, text, text, text, text) to anon, authenticated;

-- Aggregate-only bestseller feed for the homepage. It intentionally exposes
-- product names without order ids, customer fields, quantities, or revenue.
create or replace function public.grainbuds_popular_product_names(p_limit int default 8)
returns table(name text, name_de text)
language sql
stable
security definer
set search_path = public
as $$
  select p.name, p.name_de
  from public.grainbuds_order_items i
  join public.grainbuds_orders o on o.id = i.order_id
  join public.grainbuds_products p on p.id = i.product_id
  where o.status <> 'cancelled'
    and p.is_active = true
  group by p.id, p.name, p.name_de, p.sort_order
  order by sum(i.quantity) desc, p.sort_order asc, p.name asc
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
$$;

revoke all on function public.grainbuds_popular_product_names(int) from public;
grant execute on function public.grainbuds_popular_product_names(int) to anon, authenticated;

-- ============ Storage: product photos ============

insert into storage.buckets (id, name, public)
values ('grainbuds-product-images', 'grainbuds-product-images', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'grainbuds-product-images');
create policy "staff upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'grainbuds-product-images' and public.grainbuds_is_staff());
create policy "staff update product images" on storage.objects
  for update to authenticated using (bucket_id = 'grainbuds-product-images' and public.grainbuds_is_staff());
create policy "staff delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'grainbuds-product-images' and public.grainbuds_is_staff());

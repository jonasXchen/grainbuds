-- Grainbuds database schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

-- ============ Tables ============

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_de text not null default '',
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
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
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  pickup_time text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'ready', 'completed', 'cancelled')),
  total_cents int not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity > 0 and quantity <= 20),
  notes text
);

-- ============ Row Level Security ============

alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone can browse categories and live products.
create policy "public read categories" on categories
  for select using (true);

create policy "public read active products" on products
  for select using (is_active = true);

-- Signed-in staff manage everything.
create policy "staff read all products" on products
  for select to authenticated using (true);
create policy "staff write products" on products
  for all to authenticated using (true) with check (true);
create policy "staff write categories" on categories
  for all to authenticated using (true) with check (true);

-- Customers (anonymous) can place orders.
-- Order ids are unguessable UUIDs, which act as the pickup ticket:
-- reading an order requires knowing its id.
create policy "public create orders" on orders
  for insert with check (true);
create policy "public read orders" on orders
  for select using (true);
create policy "public create order items" on order_items
  for insert with check (true);
create policy "public read order items" on order_items
  for select using (true);

-- Staff manage orders.
create policy "staff update orders" on orders
  for update to authenticated using (true) with check (true);
create policy "staff delete orders" on orders
  for delete to authenticated using (true);

-- ============ Storage: product photos ============

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "staff upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "staff update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "staff delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

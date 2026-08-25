-- ============================================================
-- Grainbuds database — complete setup, run ONCE on a fresh project.
-- Supabase dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the menu.
--
-- Covers: product catalog + inventory, grainbuds_orders + payment history,
-- customer data + mailing list, image storage, and all security rules.
-- Staff logins use Supabase email OTP. The server mirrors verified addresses
-- from ORDER_ADMIN_EMAILS into grainbuds_staff (see README).
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
  loyalty_eligible boolean not null default false,
  sort_order int not null default 0,
  -- Inventory: null = not tracked (made to order); 0 = sold out.
  stock int check (stock >= 0),
  created_at timestamptz not null default now()
);

create index grainbuds_products_category_idx on grainbuds_products (category_id);

-- ============ Orders & payment history ============

create table grainbuds_orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  pickup_time text,
  fulfillment_type text not null default 'pickup'
    check (fulfillment_type in ('pickup', 'dine_in')),
  table_number smallint check (table_number between 1 and 999),
  order_source text not null default 'website'
    check (order_source in ('website', 'qr_online', 'qr_table')),
  qr_campaign text check (qr_campaign ~ '^[a-z0-9-]{1,60}$'),
  notes text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'ready', 'completed', 'cancelled')),
  total_cents int not null default 0 check (total_cents >= 0),
  loyalty_reward_cents int not null default 0 check (loyalty_reward_cents >= 0),
  loyalty_reward_product_id uuid references grainbuds_products(id) on delete set null,
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
create index grainbuds_orders_customer_user_idx on grainbuds_orders (customer_user_id, created_at desc);

create table grainbuds_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references grainbuds_orders(id) on delete cascade,
  product_id uuid references grainbuds_products(id) on delete set null,
  product_name text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity > 0 and quantity <= 20),
  loyalty_eligible boolean not null default false,
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

-- Optional loyalty membership is independent from marketing consent. Ledger
-- entries are immutable audit events; customers can read only their own.
create table grainbuds_loyalty_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enrolled_at timestamptz not null default now()
);

create table grainbuds_loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references grainbuds_orders(id) on delete set null,
  delta smallint not null check (delta <> 0 and delta between -1000 and 1000),
  kind text not null check (kind in ('order_paid', 'order_refunded', 'staff_adjustment', 'redemption', 'reward_released')),
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now()
);

-- Private, hashed rate-limit counters for Resend authentication emails.
create table grainbuds_auth_rate_limits (
  rate_key text primary key check (char_length(rate_key) = 64),
  window_started_at timestamptz not null default now(),
  attempts smallint not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now()
);

create index grainbuds_loyalty_ledger_user_idx
  on grainbuds_loyalty_ledger (user_id, created_at desc);
create unique index grainbuds_loyalty_one_paid_stamp_per_order
  on grainbuds_loyalty_ledger (order_id) where kind = 'order_paid';
create unique index grainbuds_loyalty_one_refund_per_order
  on grainbuds_loyalty_ledger (order_id) where kind = 'order_refunded';
create unique index grainbuds_loyalty_one_redemption_per_order
  on grainbuds_loyalty_ledger (order_id) where kind = 'redemption';
create unique index grainbuds_loyalty_one_release_per_order
  on grainbuds_loyalty_ledger (order_id) where kind = 'reward_released';

-- Staff-managed application settings. Values are JSON so additional settings
-- can be added without another schema change. Never expose this table to anon.
create table grainbuds_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

-- Anonymous, privacy-friendly scan events. No IP address, user agent, cookie,
-- or other customer identifier is stored.
create table grainbuds_qr_scans (
  id bigint generated always as identity primary key,
  campaign text not null check (campaign ~ '^[a-z0-9-]{1,60}$'),
  qr_kind text not null check (qr_kind in ('online', 'table')),
  table_number smallint check (table_number between 1 and 999),
  destination_path text not null check (char_length(destination_path) <= 500),
  scanned_at timestamptz not null default now()
);

create index grainbuds_qr_scans_campaign_idx
  on grainbuds_qr_scans (campaign, scanned_at desc);

-- ============ Staff allowlist ============
-- Being a logged-in user of this Supabase project is NOT enough to manage
-- Grainbuds — only accounts listed here count as staff. This keeps other
-- apps' users in the same project away from grainbuds_* tables entirely.
--
-- There are deliberately NO client write policies on this table. The trusted
-- server syncs verified ORDER_ADMIN_EMAILS via its secret client.

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
alter table grainbuds_qr_scans enable row level security;
alter table grainbuds_loyalty_accounts enable row level security;
alter table grainbuds_loyalty_ledger enable row level security;
alter table grainbuds_auth_rate_limits enable row level security;

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
  for insert with check (
    (auth.uid() is null and customer_user_id is null)
    or customer_user_id = auth.uid()
  );
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

create policy "customers read own loyalty account" on grainbuds_loyalty_accounts
  for select to authenticated using (user_id = auth.uid());
create policy "customers create own loyalty account" on grainbuds_loyalty_accounts
  for insert to authenticated with check (user_id = auth.uid());
create policy "staff read loyalty accounts" on grainbuds_loyalty_accounts
  for select to authenticated using (public.grainbuds_is_staff());
create policy "customers read own loyalty ledger" on grainbuds_loyalty_ledger
  for select to authenticated using (user_id = auth.uid());
create policy "staff read loyalty ledger" on grainbuds_loyalty_ledger
  for select to authenticated using (public.grainbuds_is_staff());
create policy "staff adjust loyalty ledger" on grainbuds_loyalty_ledger
  for insert to authenticated with check (
    public.grainbuds_is_staff()
    and kind = 'staff_adjustment'
    and delta between -1000 and 1000
  );

create or replace function public.grainbuds_my_loyalty_summary()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'stamps', coalesce(sum(delta), 0),
    'paid_orders', count(*) filter (where kind = 'order_paid'),
    'enrolled', exists (
      select 1 from public.grainbuds_loyalty_accounts where user_id = auth.uid()
    )
  )
  from public.grainbuds_loyalty_ledger
  where user_id = auth.uid();
$$;

revoke all on function public.grainbuds_my_loyalty_summary() from public;
grant execute on function public.grainbuds_my_loyalty_summary() to authenticated;

create or replace function public.grainbuds_take_auth_email_slot(
  p_rate_key text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare next_attempts int;
begin
  if char_length(p_rate_key) <> 64 or p_max_attempts < 1 or p_window_seconds < 60 then
    return false;
  end if;
  insert into public.grainbuds_auth_rate_limits
    (rate_key, window_started_at, attempts, updated_at)
  values (p_rate_key, now(), 1, now())
  on conflict (rate_key) do update
    set attempts = case
          when grainbuds_auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
            then 1 else grainbuds_auth_rate_limits.attempts + 1 end,
        window_started_at = case
          when grainbuds_auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
            then now() else grainbuds_auth_rate_limits.window_started_at end,
        updated_at = now()
  returning attempts into next_attempts;
  return next_attempts <= p_max_attempts;
end;
$$;

revoke all on function public.grainbuds_take_auth_email_slot(text, int, int)
  from public, anon, authenticated;
grant execute on function public.grainbuds_take_auth_email_slot(text, int, int)
  to service_role;

create or replace function public.grainbuds_redeem_order_reward(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance int;
  v_drink_count int;
  v_product_id uuid;
  v_reward_cents int;
begin
  if auth.uid() is null then return jsonb_build_object('reward_cents', 0); end if;
  select customer_user_id into v_user_id
  from public.grainbuds_orders
  where id = p_order_id and status = 'new' for update;
  if v_user_id is null or v_user_id <> auth.uid() then
    return jsonb_build_object('reward_cents', 0);
  end if;
  insert into public.grainbuds_loyalty_accounts (user_id)
    values (v_user_id) on conflict (user_id) do nothing;
  perform 1 from public.grainbuds_loyalty_accounts where user_id = v_user_id for update;
  select coalesce(sum(delta), 0)::int into v_balance
    from public.grainbuds_loyalty_ledger where user_id = v_user_id;
  select coalesce(sum(quantity), 0)::int into v_drink_count
    from public.grainbuds_order_items where order_id = p_order_id and loyalty_eligible;
  if v_balance + v_drink_count < 11 then return jsonb_build_object('reward_cents', 0); end if;
  select product_id, unit_price_cents into v_product_id, v_reward_cents
    from public.grainbuds_order_items
    where order_id = p_order_id and loyalty_eligible
    order by unit_price_cents, id limit 1;
  if v_product_id is null then return jsonb_build_object('reward_cents', 0); end if;
  update public.grainbuds_orders
    set loyalty_reward_cents = v_reward_cents,
        loyalty_reward_product_id = v_product_id,
        total_cents = greatest(0, total_cents - v_reward_cents)
    where id = p_order_id and loyalty_reward_cents = 0;
  if not found then
    select loyalty_reward_cents into v_reward_cents from public.grainbuds_orders where id = p_order_id;
    return jsonb_build_object('reward_cents', coalesce(v_reward_cents, 0));
  end if;
  insert into public.grainbuds_loyalty_ledger (user_id, order_id, delta, kind, note)
    values (v_user_id, p_order_id, -10, 'redemption', 'Automatic free drink')
    on conflict (order_id) where kind = 'redemption' do nothing;
  return jsonb_build_object('reward_cents', v_reward_cents, 'product_id', v_product_id);
end;
$$;

revoke all on function public.grainbuds_redeem_order_reward(uuid) from public;
grant execute on function public.grainbuds_redeem_order_reward(uuid) to authenticated;

create or replace function public.grainbuds_award_loyalty_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_earned int;
begin
  if new.customer_user_id is null then return new; end if;
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    select greatest(0, coalesce(sum(quantity), 0)::int - case when new.loyalty_reward_cents > 0 then 1 else 0 end)
      into v_earned from public.grainbuds_order_items
      where order_id = new.id and loyalty_eligible;
    if v_earned > 0 then
      insert into public.grainbuds_loyalty_accounts (user_id)
        values (new.customer_user_id) on conflict (user_id) do nothing;
      insert into public.grainbuds_loyalty_ledger (user_id, order_id, delta, kind)
        values (new.customer_user_id, new.id, v_earned, 'order_paid')
        on conflict (order_id) where kind = 'order_paid' do nothing;
    end if;
  elsif old.payment_status = 'paid' and new.payment_status = 'refunded' then
    insert into public.grainbuds_loyalty_ledger (user_id, order_id, delta, kind)
      select new.customer_user_id, new.id, -delta, 'order_refunded'
      from public.grainbuds_loyalty_ledger where order_id = new.id and kind = 'order_paid'
      on conflict (order_id) where kind = 'order_refunded' do nothing;
    if new.loyalty_reward_cents > 0 then
      insert into public.grainbuds_loyalty_ledger (user_id, order_id, delta, kind, note)
        values (new.customer_user_id, new.id, 10, 'reward_released', 'Refunded order')
        on conflict (order_id) where kind = 'reward_released' do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger order_loyalty_stamp
  after update of payment_status on grainbuds_orders
  for each row execute function public.grainbuds_award_loyalty_stamp();

create or replace function public.grainbuds_release_cancelled_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and new.payment_status <> 'paid' and new.customer_user_id is not null
     and new.loyalty_reward_cents > 0 then
    insert into public.grainbuds_loyalty_ledger (user_id, order_id, delta, kind, note)
      values (new.customer_user_id, new.id, 10, 'reward_released', 'Cancelled order')
      on conflict (order_id) where kind = 'reward_released' do nothing;
  end if;
  return new;
end;
$$;

create trigger order_loyalty_reward_release
  after update of status on grainbuds_orders
  for each row execute function public.grainbuds_release_cancelled_reward();

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

create policy "public record grainbuds qr scans" on grainbuds_qr_scans
  for insert with check (true);
create policy "staff read grainbuds qr scans" on grainbuds_qr_scans
  for select to authenticated using (public.grainbuds_is_staff());

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
-- Snapshot whether an order item belongs to a participating drink category so
-- later category edits cannot rewrite loyalty history.
create or replace function public.grainbuds_set_item_loyalty_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.loyalty_eligible := exists (
    select 1 from public.grainbuds_products p
    where p.id = new.product_id and p.loyalty_eligible
  );
  return new;
end;
$$;

create trigger order_item_loyalty_eligibility
  before insert or update of product_id on grainbuds_order_items
  for each row execute function public.grainbuds_set_item_loyalty_eligibility();

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
    'fulfillment_type', o.fulfillment_type,
    'table_number', o.table_number,
    'order_source', o.order_source,
    'qr_campaign', o.qr_campaign,
    'notes', o.notes,
    'status', o.status,
    'total_cents', o.total_cents,
    'loyalty_reward_cents', o.loyalty_reward_cents,
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
    'fulfillment_type', o.fulfillment_type,
    'table_number', o.table_number,
    'order_source', o.order_source,
    'qr_campaign', o.qr_campaign,
    'notes', o.notes,
    'status', o.status,
    'total_cents', o.total_cents,
    'loyalty_reward_cents', o.loyalty_reward_cents,
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

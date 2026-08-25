-- Optional customer accounts and an auditable loyalty stamp ledger.
-- A signed-in customer earns one stamp when staff marks their order paid.

alter table public.grainbuds_orders
  add column if not exists customer_user_id uuid
    references auth.users(id) on delete set null;

create index if not exists grainbuds_orders_customer_user_idx
  on public.grainbuds_orders (customer_user_id, created_at desc);

create table if not exists public.grainbuds_loyalty_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enrolled_at timestamptz not null default now()
);

create table if not exists public.grainbuds_loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.grainbuds_orders(id) on delete set null,
  delta smallint not null check (delta <> 0 and delta between -10 and 10),
  kind text not null check (kind in ('order_paid', 'order_refunded', 'staff_adjustment', 'redemption')),
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now()
);

create index if not exists grainbuds_loyalty_ledger_user_idx
  on public.grainbuds_loyalty_ledger (user_id, created_at desc);
create unique index if not exists grainbuds_loyalty_one_paid_stamp_per_order
  on public.grainbuds_loyalty_ledger (order_id)
  where kind = 'order_paid';
create unique index if not exists grainbuds_loyalty_one_refund_per_order
  on public.grainbuds_loyalty_ledger (order_id)
  where kind = 'order_refunded';

alter table public.grainbuds_loyalty_accounts enable row level security;
alter table public.grainbuds_loyalty_ledger enable row level security;

create policy "customers read own loyalty account"
  on public.grainbuds_loyalty_accounts
  for select to authenticated
  using (user_id = auth.uid());
create policy "customers create own loyalty account"
  on public.grainbuds_loyalty_accounts
  for insert to authenticated
  with check (user_id = auth.uid());
create policy "staff read loyalty accounts"
  on public.grainbuds_loyalty_accounts
  for select to authenticated
  using (public.grainbuds_is_staff());

create policy "customers read own loyalty ledger"
  on public.grainbuds_loyalty_ledger
  for select to authenticated
  using (user_id = auth.uid());
create policy "staff read loyalty ledger"
  on public.grainbuds_loyalty_ledger
  for select to authenticated
  using (public.grainbuds_is_staff());

-- Replace the broad insert policy so a signed-in customer can only attach
-- their own identity. Anonymous orders must remain anonymous.
drop policy if exists "public create grainbuds_orders" on public.grainbuds_orders;
create policy "public create grainbuds_orders" on public.grainbuds_orders
  for insert
  with check (
    (auth.uid() is null and customer_user_id is null)
    or customer_user_id = auth.uid()
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
      select 1 from public.grainbuds_loyalty_accounts
      where user_id = auth.uid()
    )
  )
  from public.grainbuds_loyalty_ledger
  where user_id = auth.uid();
$$;

revoke all on function public.grainbuds_my_loyalty_summary() from public;
grant execute on function public.grainbuds_my_loyalty_summary() to authenticated;

create or replace function public.grainbuds_award_loyalty_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_user_id is null then
    return new;
  end if;

  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid' then
    insert into public.grainbuds_loyalty_accounts (user_id)
      values (new.customer_user_id)
      on conflict (user_id) do nothing;

    insert into public.grainbuds_loyalty_ledger
      (user_id, order_id, delta, kind)
      values (new.customer_user_id, new.id, 1, 'order_paid')
      on conflict (order_id) where kind = 'order_paid' do nothing;
  elsif old.payment_status = 'paid'
        and new.payment_status = 'refunded' then
    insert into public.grainbuds_loyalty_ledger
      (user_id, order_id, delta, kind)
      select new.customer_user_id, new.id, -1, 'order_refunded'
      where exists (
        select 1 from public.grainbuds_loyalty_ledger
        where order_id = new.id and kind = 'order_paid'
      )
      on conflict (order_id) where kind = 'order_refunded' do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists order_loyalty_stamp on public.grainbuds_orders;
create trigger order_loyalty_stamp
  after update of payment_status on public.grainbuds_orders
  for each row execute function public.grainbuds_award_loyalty_stamp();

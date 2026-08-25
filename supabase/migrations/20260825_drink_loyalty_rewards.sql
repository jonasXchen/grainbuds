-- Drink-based loyalty: 10 paid drinks unlock the cheapest drink in the next
-- order. Rewards are reserved at checkout and released on cancellation/refund.

alter table public.grainbuds_orders
  add column if not exists loyalty_reward_cents int not null default 0
    check (loyalty_reward_cents >= 0),
  add column if not exists loyalty_reward_product_id uuid
    references public.grainbuds_products(id) on delete set null;

alter table public.grainbuds_order_items
  add column if not exists loyalty_eligible boolean not null default false;

create or replace function public.grainbuds_set_item_loyalty_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.loyalty_eligible := exists (
    select 1
    from public.grainbuds_products p
    join public.grainbuds_categories c on c.id = p.category_id
    where p.id = new.product_id
      and c.slug in (
        'specialty-matcha', 'matcha-refresher', 'hojicha', 'smoothies',
        'fruit-tea', 'fruit-cloud', 'tapioca-boba'
      )
  );
  return new;
end;
$$;

drop trigger if exists order_item_loyalty_eligibility on public.grainbuds_order_items;
create trigger order_item_loyalty_eligibility
  before insert or update of product_id on public.grainbuds_order_items
  for each row execute function public.grainbuds_set_item_loyalty_eligibility();

update public.grainbuds_order_items i
set loyalty_eligible = exists (
  select 1
  from public.grainbuds_products p
  join public.grainbuds_categories c on c.id = p.category_id
  where p.id = i.product_id
    and c.slug in (
      'specialty-matcha', 'matcha-refresher', 'hojicha', 'smoothies',
      'fruit-tea', 'fruit-cloud', 'tapioca-boba'
    )
);

alter table public.grainbuds_loyalty_ledger
  drop constraint if exists grainbuds_loyalty_ledger_delta_check,
  drop constraint if exists grainbuds_loyalty_ledger_kind_check;
alter table public.grainbuds_loyalty_ledger
  add constraint grainbuds_loyalty_ledger_delta_check
    check (delta <> 0 and delta between -1000 and 1000),
  add constraint grainbuds_loyalty_ledger_kind_check
    check (kind in ('order_paid', 'order_refunded', 'staff_adjustment', 'redemption', 'reward_released'));

-- Convert stamps previously awarded per order into stamps per paid drink.
delete from public.grainbuds_loyalty_ledger l
where l.kind in ('order_paid', 'order_refunded')
  and not exists (
    select 1 from public.grainbuds_order_items i
    where i.order_id = l.order_id and i.loyalty_eligible
  );

update public.grainbuds_loyalty_ledger l
set delta = case when l.kind = 'order_refunded' then -x.drinks else x.drinks end
from (
  select order_id, sum(quantity)::smallint as drinks
  from public.grainbuds_order_items
  where loyalty_eligible
  group by order_id
) x
where l.order_id = x.order_id
  and l.kind in ('order_paid', 'order_refunded');

create unique index if not exists grainbuds_loyalty_one_redemption_per_order
  on public.grainbuds_loyalty_ledger (order_id) where kind = 'redemption';
create unique index if not exists grainbuds_loyalty_one_release_per_order
  on public.grainbuds_loyalty_ledger (order_id) where kind = 'reward_released';

create policy "staff adjust loyalty ledger"
  on public.grainbuds_loyalty_ledger
  for insert to authenticated
  with check (
    public.grainbuds_is_staff()
    and kind = 'staff_adjustment'
    and delta between -10 and 10
  );

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
  if auth.uid() is null then
    return jsonb_build_object('reward_cents', 0);
  end if;

  select customer_user_id into v_user_id
  from public.grainbuds_orders
  where id = p_order_id and status = 'new'
  for update;

  if v_user_id is null or v_user_id <> auth.uid() then
    return jsonb_build_object('reward_cents', 0);
  end if;

  insert into public.grainbuds_loyalty_accounts (user_id)
    values (v_user_id) on conflict (user_id) do nothing;
  perform 1 from public.grainbuds_loyalty_accounts
    where user_id = v_user_id for update;

  select coalesce(sum(delta), 0)::int into v_balance
  from public.grainbuds_loyalty_ledger where user_id = v_user_id;
  select coalesce(sum(quantity), 0)::int into v_drink_count
  from public.grainbuds_order_items
  where order_id = p_order_id and loyalty_eligible;
  if v_balance + v_drink_count < 11 then
    return jsonb_build_object('reward_cents', 0);
  end if;

  select product_id, unit_price_cents
    into v_product_id, v_reward_cents
  from public.grainbuds_order_items
  where order_id = p_order_id and loyalty_eligible
  order by unit_price_cents, id
  limit 1;
  if v_product_id is null or v_reward_cents is null then
    return jsonb_build_object('reward_cents', 0);
  end if;

  update public.grainbuds_orders
  set loyalty_reward_cents = v_reward_cents,
      loyalty_reward_product_id = v_product_id,
      total_cents = greatest(0, total_cents - v_reward_cents)
  where id = p_order_id and loyalty_reward_cents = 0;

  if not found then
    select loyalty_reward_cents into v_reward_cents
    from public.grainbuds_orders where id = p_order_id;
    return jsonb_build_object('reward_cents', coalesce(v_reward_cents, 0));
  end if;

  insert into public.grainbuds_loyalty_ledger
    (user_id, order_id, delta, kind, note)
  values (v_user_id, p_order_id, -10, 'redemption', 'Automatic free drink')
  on conflict (order_id) where kind = 'redemption' do nothing;

  return jsonb_build_object(
    'reward_cents', v_reward_cents,
    'product_id', v_product_id
  );
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
declare
  v_earned int;
begin
  if new.customer_user_id is null then return new; end if;

  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    select greatest(
      0,
      coalesce(sum(quantity), 0)::int - case when new.loyalty_reward_cents > 0 then 1 else 0 end
    ) into v_earned
    from public.grainbuds_order_items
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
      from public.grainbuds_loyalty_ledger
      where order_id = new.id and kind = 'order_paid'
      on conflict (order_id) where kind = 'order_refunded' do nothing;

    if new.loyalty_reward_cents > 0 then
      insert into public.grainbuds_loyalty_ledger
        (user_id, order_id, delta, kind, note)
      values (new.customer_user_id, new.id, 10, 'reward_released', 'Refunded order')
      on conflict (order_id) where kind = 'reward_released' do nothing;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.grainbuds_release_cancelled_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and new.payment_status <> 'paid'
     and new.customer_user_id is not null
     and new.loyalty_reward_cents > 0 then
    insert into public.grainbuds_loyalty_ledger
      (user_id, order_id, delta, kind, note)
    values (new.customer_user_id, new.id, 10, 'reward_released', 'Cancelled order')
    on conflict (order_id) where kind = 'reward_released' do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists order_loyalty_reward_release on public.grainbuds_orders;
create trigger order_loyalty_reward_release
  after update of status on public.grainbuds_orders
  for each row execute function public.grainbuds_release_cancelled_reward();

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
      from public.grainbuds_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.grainbuds_orders o where o.id = order_id;
$$;

grant execute on function public.grainbuds_order_confirmation(uuid) to anon, authenticated;

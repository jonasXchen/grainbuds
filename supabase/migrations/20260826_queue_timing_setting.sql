-- Makes the estimated preparation time configurable by staff. The protected
-- settings table remains private; public callers receive only the safe scalar.

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
      from public.grainbuds_orders o
      where o.status in ('new', 'in_progress')
    ),
    'queued_drinks', (
      select coalesce(sum(i.quantity), 0)
      from public.grainbuds_order_items i
      join public.grainbuds_orders o on o.id = i.order_id
      join public.grainbuds_products p on p.id = i.product_id
      join public.grainbuds_categories c on c.id = p.category_id
      where o.status in ('new', 'in_progress')
        and c.slug in (
          'specialty-matcha', 'matcha-refresher', 'hojicha', 'smoothies',
          'fruit-tea', 'fruit-cloud', 'tapioca-boba'
        )
    ),
    'seconds_per_drink', coalesce((
      select case
        when jsonb_typeof(s.value) = 'number'
          and (s.value #>> '{}')::numeric between 6 and 600
        then (s.value #>> '{}')::numeric
        else 30
      end
      from public.grainbuds_settings s
      where s.key = 'queue_seconds_per_drink'
    ), 30)
  );
$$;

revoke all on function public.grainbuds_queue_snapshot() from public;
grant execute on function public.grainbuds_queue_snapshot() to anon, authenticated;

create or replace function public.grainbuds_order_queue_status(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_created_at timestamptz;
  v_status text;
  v_position int;
  v_queued_drinks int;
  v_seconds_per_drink numeric;
begin
  select o.created_at, o.status into v_created_at, v_status
  from public.grainbuds_orders o
  where o.id = p_order_id;

  if not found then return null; end if;
  if v_status not in ('new', 'in_progress') then
    return jsonb_build_object('active', false, 'position', 0, 'waiting_minutes', 0);
  end if;

  select count(*)::int into v_position
  from public.grainbuds_orders o
  where o.status in ('new', 'in_progress')
    and (o.created_at, o.id) <= (v_created_at, p_order_id);

  select coalesce(sum(i.quantity), 0)::int into v_queued_drinks
  from public.grainbuds_order_items i
  join public.grainbuds_orders o on o.id = i.order_id
  join public.grainbuds_products p on p.id = i.product_id
  join public.grainbuds_categories c on c.id = p.category_id
  where o.status in ('new', 'in_progress')
    and (o.created_at, o.id) <= (v_created_at, p_order_id)
    and c.slug in (
      'specialty-matcha', 'matcha-refresher', 'hojicha', 'smoothies',
      'fruit-tea', 'fruit-cloud', 'tapioca-boba'
    );

  select coalesce((
    select case
      when jsonb_typeof(s.value) = 'number'
        and (s.value #>> '{}')::numeric between 6 and 600
      then (s.value #>> '{}')::numeric
      else 30
    end
    from public.grainbuds_settings s
    where s.key = 'queue_seconds_per_drink'
  ), 30) into v_seconds_per_drink;

  return jsonb_build_object(
    'active', true,
    'position', greatest(1, v_position),
    'waiting_minutes', greatest(
      1,
      ceil(v_queued_drinks * v_seconds_per_drink / 60.0)::int
    )
  );
end;
$$;

revoke all on function public.grainbuds_order_queue_status(uuid)
  from public, anon, authenticated;
grant execute on function public.grainbuds_order_queue_status(uuid)
  to anon, authenticated;

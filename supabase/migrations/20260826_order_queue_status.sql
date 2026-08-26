-- Privacy-safe live position and wait estimate for an exact order id.
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
  where o.status in ('new', 'in_progress')
    and (o.created_at, o.id) <= (v_created_at, p_order_id)
    and i.loyalty_eligible;

  return jsonb_build_object(
    'active', true,
    'position', greatest(1, v_position),
    'waiting_minutes', greatest(1, ceil(v_queued_drinks * 30.0 / 60.0)::int)
  );
end;
$$;

revoke all on function public.grainbuds_order_queue_status(uuid)
  from public, anon, authenticated;
grant execute on function public.grainbuds_order_queue_status(uuid)
  to anon, authenticated;

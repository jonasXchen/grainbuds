-- Adds a privacy-preserving queue snapshot for checkout estimates.
-- This migration is non-destructive and preserves all existing data.

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

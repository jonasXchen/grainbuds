-- Public bestseller names for the homepage marquee.
-- This deliberately returns no order ids, customer fields, or sales counts.
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

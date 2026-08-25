-- Make stamp-card eligibility configurable per product in Admin.

alter table public.grainbuds_products
  add column if not exists loyalty_eligible boolean not null default false;

-- Preserve the current behavior on upgrade: existing drink categories start
-- enabled. Admin can change any individual product afterwards.
update public.grainbuds_products p
set loyalty_eligible = true
from public.grainbuds_categories c
where c.id = p.category_id
  and c.slug in (
    'specialty-matcha', 'matcha-refresher', 'hojicha', 'smoothies',
    'fruit-tea', 'fruit-cloud', 'tapioca-boba'
  );

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

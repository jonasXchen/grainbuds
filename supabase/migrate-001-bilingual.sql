-- Migration: add German (DE) fields for the bilingual site.
-- ONLY needed if you already ran an older schema.sql — fresh setups get
-- these columns from schema.sql directly. Safe to run more than once.

alter table categories add column if not exists name_de text not null default '';
alter table products add column if not exists name_de text not null default '';
alter table products add column if not exists description_de text not null default '';

-- Remove the old fictional sample menu (pre-real-data seed), if present.
-- Skips anything you created yourself; only these exact sample slugs go.
delete from products where slug in (
  'ceremonial-matcha-latte', 'yuzu-matcha-tonic', 'pure-usucha',
  'hojicha-latte', 'sesame-latte', 'jasmine-cold-brew',
  'brown-sugar-oat-latte', 'grain-bowl', 'onigiri-set', 'milk-bread-sando',
  'matcha-basque-cheesecake', 'black-sesame-cookie', 'mochi-donut',
  'ceremonial-matcha-tin', 'whisk-bowl-set'
);
delete from categories where slug in (
  'matcha', 'coffee-tea', 'bowls-bites', 'desserts', 'brew-at-home'
) and not exists (select 1 from products where products.category_id = categories.id);

-- Now run the new seed.sql to load the real menu.

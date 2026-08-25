-- Staff testing the customer preview remain authenticated, but their preview
-- orders are deliberately not linked to loyalty. Permit that exact case while
-- retaining the existing guest and own-customer identity checks.
drop policy if exists "public create grainbuds_orders"
  on public.grainbuds_orders;

create policy "public create grainbuds_orders"
  on public.grainbuds_orders
  for insert
  with check (
    (auth.uid() is null and customer_user_id is null)
    or (public.grainbuds_is_staff() and customer_user_id is null)
    or customer_user_id = auth.uid()
  );

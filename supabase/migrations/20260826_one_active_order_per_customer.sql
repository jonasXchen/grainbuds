-- An anonymous customer may have only one order currently being prepared for
-- the same case-insensitive checkout email. Logged-in customers are exempt.
-- Completed and cancelled guest orders do not prevent a new checkout.
create unique index if not exists grainbuds_one_active_guest_order_per_email
  on public.grainbuds_orders (lower(customer_email))
  where customer_user_id is null
    and status in ('new', 'in_progress', 'ready');

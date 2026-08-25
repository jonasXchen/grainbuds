-- Allow staff to save an absolute stamp-card balance in one audited ledger entry.
drop policy if exists "staff adjust loyalty ledger"
  on public.grainbuds_loyalty_ledger;

create policy "staff adjust loyalty ledger"
  on public.grainbuds_loyalty_ledger
  for insert to authenticated
  with check (
    public.grainbuds_is_staff()
    and kind = 'staff_adjustment'
    and delta between -1000 and 1000
  );

-- Server-only throttle for passwordless codes sent through Resend.
-- Keys are SHA-256 hashes; raw email addresses and IPs are not stored here.

create table if not exists public.grainbuds_auth_rate_limits (
  rate_key text primary key check (char_length(rate_key) = 64),
  window_started_at timestamptz not null default now(),
  attempts smallint not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now()
);

alter table public.grainbuds_auth_rate_limits enable row level security;

create or replace function public.grainbuds_take_auth_email_slot(
  p_rate_key text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_attempts int;
begin
  if char_length(p_rate_key) <> 64
     or p_max_attempts < 1
     or p_window_seconds < 60 then
    return false;
  end if;

  insert into public.grainbuds_auth_rate_limits
    (rate_key, window_started_at, attempts, updated_at)
  values (p_rate_key, now(), 1, now())
  on conflict (rate_key) do update
    set attempts = case
          when grainbuds_auth_rate_limits.window_started_at
               <= now() - make_interval(secs => p_window_seconds)
            then 1
          else grainbuds_auth_rate_limits.attempts + 1
        end,
        window_started_at = case
          when grainbuds_auth_rate_limits.window_started_at
               <= now() - make_interval(secs => p_window_seconds)
            then now()
          else grainbuds_auth_rate_limits.window_started_at
        end,
        updated_at = now()
  returning attempts into next_attempts;

  return next_attempts <= p_max_attempts;
end;
$$;

revoke all on function public.grainbuds_take_auth_email_slot(text, int, int)
  from public, anon, authenticated;
grant execute on function public.grainbuds_take_auth_email_slot(text, int, int)
  to service_role;

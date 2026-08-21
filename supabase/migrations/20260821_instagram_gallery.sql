-- Allows the public homepage to read only the staff-managed Instagram gallery
-- configuration, without exposing other protected application settings.

create or replace function public.grainbuds_get_instagram_gallery()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select value
  from public.grainbuds_settings
  where key = 'instagram_gallery'
  limit 1;
$$;

revoke all on function public.grainbuds_get_instagram_gallery() from public;
grant execute on function public.grainbuds_get_instagram_gallery() to anon, authenticated;

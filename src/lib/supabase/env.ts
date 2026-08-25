/**
 * Supabase connection values.
 *
 * Newer Supabase projects issue a "publishable" key (sb_publishable_...);
 * older ones issue a legacy "anon" JWT. Either works — set whichever your
 * project has. The secret key (sb_secret_...) is read only by server-only
 * modules and must never be added to this public environment helper.
 *
 * Accesses must stay as literal `process.env.NEXT_PUBLIC_*` expressions so
 * Next.js can inline them into the client bundle.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseEnv(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

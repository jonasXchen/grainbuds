import { createClient, hasSupabaseEnv } from "./supabase/server";

/**
 * True only when the current session belongs to an account on the
 * grainbuds_staff allowlist — being any authenticated user of the
 * Supabase project is not enough.
 */
export async function getIsStaff(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("grainbuds_is_staff");
  return data === true;
}

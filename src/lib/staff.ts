import { cookies } from "next/headers";
import { createClient, hasSupabaseEnv } from "./supabase/server";
import { isAdminEmail } from "./admin-emails";

/**
 * True only when the verified email is in ORDER_ADMIN_EMAILS and the account
 * has the mirrored grainbuds_staff row used by database RLS.
 */
export async function getIsStaff(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return false;
  const { data } = await supabase.rpc("grainbuds_is_staff");
  return data === true;
}

/**
 * Staff can preview the site exactly as customers see it without signing
 * out — the toggle in the staff pill sets this cookie.
 */
export async function getViewMode(): Promise<{
  isStaff: boolean;
  adminMode: boolean;
}> {
  const isStaff = await getIsStaff();
  if (!isStaff) return { isStaff: false, adminMode: false };
  const cookieStore = await cookies();
  const customerPreview = cookieStore.get("grainbuds-view")?.value === "customer";
  return { isStaff: true, adminMode: !customerPreview };
}

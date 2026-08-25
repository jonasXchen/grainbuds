"use server";

import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-emails";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function requestAdminCode(emailInput: string): Promise<AuthResult> {
  if (!hasSupabaseEnv()) {
    return {
      ok: false,
      error:
        "Supabase is not configured yet. Add your project keys to .env.local first (see README).",
    };
  }

  const email = emailInput.trim().toLowerCase();
  if (!isAdminEmail(email)) {
    return { ok: false, error: "This email is not configured for admin access." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    return { ok: false, error: "Could not send the email code. Please try again." };
  }
  return { ok: true };
}

export async function verifyAdminCode(
  emailInput: string,
  tokenInput: string
): Promise<AuthResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const email = emailInput.trim().toLowerCase();
  const token = tokenInput.trim();
  if (!isAdminEmail(email)) {
    return { ok: false, error: "This email is not configured for admin access." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error || !data.user || !isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { ok: false, error: "That code is invalid or has expired." };
  }

  // Cache the environment allowlist decision in the database so the existing
  // RLS policies continue to protect every admin query and mutation.
  const adminClient = createAdminClient();
  if (!adminClient) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "SUPABASE_SECRET_KEY is required to activate admin access.",
    };
  }
  const { error: staffError } = await adminClient.from("grainbuds_staff").upsert(
    {
      user_id: data.user.id,
      email: data.user.email?.toLowerCase() ?? email,
    },
    { onConflict: "user_id" }
  );
  if (staffError) {
    await supabase.auth.signOut();
    return { ok: false, error: "Could not activate admin access. Please try again." };
  }

  return { ok: true };
}

export async function logout() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

/** Sign out from the public-site staff menu and stay on the storefront. */
export async function logoutToHome() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

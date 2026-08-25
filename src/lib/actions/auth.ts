"use server";

import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-emails";
import { sendAuthCode } from "@/lib/auth-email";

export type AuthResult = { ok: true } | { ok: false; error: string };
export type AdminActivationResult =
  | { ok: true; isAdmin: boolean }
  | { ok: false; isAdmin: false; error: string };

export async function requestCustomerCode(emailInput: string): Promise<AuthResult> {
  const result = await sendAuthCode(emailInput);
  if (result.ok) return result;
  return {
    ok: false,
    error:
      result.error === "not_configured"
        ? "Email login is not configured."
        : "Could not send the email code. Please try again.",
  };
}

export async function verifyCustomerCode(
  emailInput: string,
  tokenInput: string
): Promise<AdminActivationResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, isAdmin: false, error: "Email login is not configured." };
  }

  const email = emailInput.trim().toLowerCase();
  const token = tokenInput.trim();
  if (!/^\d{6}$/.test(token)) {
    return {
      ok: false,
      isAdmin: false,
      error: "Please enter the complete six-digit code.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error || !data.user) {
    return {
      ok: false,
      isAdmin: false,
      error: "That code is invalid or has expired.",
    };
  }

  // Every storefront login gets a stamp card, including admins using the same
  // identity. Keeping verification server-side also makes the new auth cookie
  // available to the refreshed server layout immediately.
  const { error: enrollmentError } = await supabase
    .from("grainbuds_loyalty_accounts")
    .insert({ user_id: data.user.id });
  if (enrollmentError && enrollmentError.code !== "23505") {
    await supabase.auth.signOut();
    return {
      ok: false,
      isAdmin: false,
      error: "Could not open the stamp card. Please request a new code.",
    };
  }

  if (!isAdminEmail(data.user.email)) {
    return { ok: true, isAdmin: false };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    await supabase.auth.signOut();
    return {
      ok: false,
      isAdmin: false,
      error: "Could not activate admin access.",
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
    return {
      ok: false,
      isAdmin: false,
      error: "Could not activate admin access.",
    };
  }

  return { ok: true, isAdmin: true };
}

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

  const result = await sendAuthCode(email);
  if (!result.ok) {
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
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, error: "Please enter the complete six-digit code." };
  }
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

/**
 * Promote an already verified customer-session login when its email is in the
 * server-only admin allowlist. This lets the shared storefront login become
 * the admin entry point without exposing the allowlist to the browser.
 */
export async function activateCurrentAdmin(): Promise<AdminActivationResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, isAdmin: false, error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: true, isAdmin: false };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      isAdmin: false,
      error: "SUPABASE_SECRET_KEY is required to activate admin access.",
    };
  }

  const { error } = await adminClient.from("grainbuds_staff").upsert(
    {
      user_id: user.id,
      email: user.email?.toLowerCase() ?? "",
    },
    { onConflict: "user_id" }
  );
  if (error) {
    return {
      ok: false,
      isAdmin: false,
      error: "Could not activate admin access.",
    };
  }

  return { ok: true, isAdmin: true };
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

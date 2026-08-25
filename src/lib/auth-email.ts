import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export type AuthEmailResult =
  | { ok: true }
  | { ok: false; error: "invalid_email" | "not_configured" | "send_failed" };

/** Generate a Supabase-compatible OTP and deliver it through Resend. */
export async function sendAuthCode(emailInput: string): Promise<AuthEmailResult> {
  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const adminClient = createAdminClient();
  const resendKey = process.env.RESEND_API_KEY;
  if (!adminClient || !resendKey) {
    return { ok: false, error: "not_configured" };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const [emailLimit, addressLimit] = await Promise.all([
    adminClient.rpc("grainbuds_take_auth_email_slot", {
      p_rate_key: hash(`email:${email}`),
      p_max_attempts: 5,
      p_window_seconds: 600,
    }),
    adminClient.rpc("grainbuds_take_auth_email_slot", {
      p_rate_key: hash(`address:${clientAddress}`),
      p_max_attempts: 20,
      p_window_seconds: 600,
    }),
  ]);
  if (emailLimit.error || addressLimit.error) {
    console.error("Could not check authentication email rate limit");
    return { ok: false, error: "not_configured" };
  }
  if (emailLimit.data !== true || addressLimit.data !== true) {
    return { ok: false, error: "send_failed" };
  }

  // generateLink creates the one-time credential but does not send an email.
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const code = data?.properties?.email_otp;
  if (error || !code) {
    console.error("Could not generate authentication code", {
      message: error?.message,
    });
    return { ok: false, error: "send_failed" };
  }

  const from =
    process.env.AUTH_FROM_EMAIL ||
    process.env.ORDER_FROM_EMAIL ||
    "Grainbuds <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Grainbuds sign-in code · Dein Grainbuds Anmeldecode",
      text: `Your Grainbuds sign-in code is ${code}. It expires shortly and can be used only once.\n\nDein Grainbuds Anmeldecode lautet ${code}. Er läuft in Kürze ab und kann nur einmal verwendet werden.`,
      html: `<div style="font-family:Arial,sans-serif;color:#121a25;line-height:1.6;max-width:520px;margin:auto"><p style="color:#56651f;font-size:12px;letter-spacing:.18em;text-transform:uppercase">Grainbuds</p><h1 style="font-family:Georgia,serif;font-weight:400">Your sign-in code</h1><p>Enter this one-time code on the Grainbuds website:</p><p style="font-size:32px;font-weight:700;letter-spacing:.25em;background:#f4f0ea;border-radius:16px;padding:18px;text-align:center">${code}</p><p style="color:#56606b;font-size:14px">The code expires shortly. If you did not request it, you can ignore this email.</p><hr style="border:0;border-top:1px solid #eae3da;margin:28px 0"><h2 style="font-family:Georgia,serif;font-weight:400">Dein Anmeldecode</h2><p>Gib diesen einmaligen Code auf der Grainbuds-Website ein. Er läuft in Kürze ab. Falls du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.</p></div>`,
    }),
  });

  if (!response.ok) {
    console.error("Could not send authentication email", {
      status: response.status,
    });
    return { ok: false, error: "send_failed" };
  }

  return { ok: true };
}

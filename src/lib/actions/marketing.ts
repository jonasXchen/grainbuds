"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export type CampaignState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

async function requireAdmin() {
  if (!hasSupabaseEnv()) throw new Error("Supabase is not configured.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isStaff } = await supabase.rpc("grainbuds_is_staff");
  if (isStaff !== true) redirect("/admin");
  return supabase;
}

/**
 * Sends an email campaign to everyone on the mailing list (explicit opt-ins
 * only) via Resend. Needs RESEND_API_KEY in .env.local — server-only, never
 * exposed to the browser.
 */
export async function sendCampaign(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  const supabase = await requireAdmin();

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) {
    return { ok: false, error: "Please fill in a subject and a message." };
  }

  const { data: subscribers } = await supabase
    .from("grainbuds_subscribers")
    .select("email, name");
  if (!subscribers?.length) {
    return { ok: false, error: "The mailing list is empty — nothing to send." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email sending isn't set up yet. Create a free resend.com account, verify your domain, and add RESEND_API_KEY to .env.local (see README). Until then, use “Copy all emails” and send from your own mail program via BCC.",
    };
  }
  const from =
    process.env.MARKETING_FROM_EMAIL || "Grainbuds <onboarding@resend.dev>";

  const text = `${message}\n\n—\nGrainbuds · Universitätsstraße 7, 91054 Erlangen\nYou receive this because you opted in at checkout. Reply "unsubscribe" to be removed. / Sie erhalten diese E-Mail, weil Sie beim Bestellen zugestimmt haben. Antworten Sie mit "unsubscribe", um sich abzumelden.`;

  // Resend batch endpoint takes up to 100 messages per call.
  let sent = 0;
  for (let i = 0; i < subscribers.length; i += 100) {
    const batch = subscribers.slice(i, i + 100).map((subscriber) => ({
      from,
      to: [subscriber.email],
      subject,
      text,
    }));
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Sending failed after ${sent} emails (${response.status}). ${detail.slice(0, 200)}`,
      };
    }
    sent += batch.length;
  }

  return { ok: true, message: `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.` };
}

export async function removeSubscriber(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("grainbuds_subscribers").delete().eq("id", id);
    revalidatePath("/admin/customers");
  }
}

import NotificationSettingsForm from "@/components/admin/NotificationSettingsForm";
import InstagramGallerySettingsForm from "@/components/admin/InstagramGallerySettingsForm";
import { parseInstagramGallerySettings } from "@/lib/instagram-gallery";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Einstellungen", description: "Legen Sie fest, wohin betriebliche Bestellbenachrichtigungen gesendet werden.", emails: "Bestell-E-Mails", emailHint: "Kunden erhalten Bestätigungs- und Stornierungs-E-Mails an die Adresse ihrer Bestellung.", configured: "Versand eingerichtet", setup: "Einrichtung erforderlich", instagram: "Instagram-Galerie", instagramHint: "Wählen Sie das Instagram-Profil und die Fotos für die Galerie auf der Startseite. Es werden keine Instagram-Tracking-Skripte geladen." }
    : { title: "Settings", description: "Configure where operational order notifications are delivered.", emails: "Order emails", emailHint: "Customers receive confirmation and cancellation emails at the address on their order.", configured: "Delivery configured", setup: "Setup required", instagram: "Instagram gallery", instagramHint: "Choose the Instagram profile and photos shown in the homepage café gallery. Instagram tracking scripts are not loaded." };
  const { data } = await supabase
    .from("grainbuds_settings")
    .select("key, value")
    .in("key", ["order_notification_emails", "instagram_gallery"]);
  const emailValue = data?.find(
    (setting) => setting.key === "order_notification_emails"
  )?.value;
  const instagramValue = data?.find(
    (setting) => setting.key === "instagram_gallery"
  )?.value;
  const emails = Array.isArray(emailValue)
    ? emailValue.filter((value): value is string => typeof value === "string")
    : [];
  const instagramSettings = parseInstagramGallerySettings(instagramValue);

  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const secureSettingsConfigured = Boolean(process.env.SUPABASE_SECRET_KEY);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 text-ink/60">
        {copy.description}
      </p>

      <section className="mt-10 rounded-3xl bg-cream-light p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{copy.emails}</h2>
            <p className="mt-1 text-sm text-ink/55">
              {copy.emailHint}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              emailConfigured && secureSettingsConfigured
                ? "bg-matcha/20 text-matcha-deep"
                : "bg-sand/25 text-sand-deep"
            }`}
          >
            {emailConfigured && secureSettingsConfigured
              ? copy.configured
              : copy.setup}
          </span>
        </div>

        <NotificationSettingsForm initialEmails={emails.join("\n")} />

        {(!emailConfigured || !secureSettingsConfigured) && (
          <div className="mt-6 rounded-2xl border border-sand/40 bg-sand/10 px-5 py-4 text-sm leading-relaxed text-ink/65">
            {!emailConfigured && (
              <p>
                Add <code>RESEND_API_KEY</code> and a verified{" "}
                <code>ORDER_FROM_EMAIL</code> to the deployment environment.
              </p>
            )}
            {!secureSettingsConfigured && (
              <p className={emailConfigured ? "" : "mt-2"}>
                Add the server-only <code>SUPABASE_SECRET_KEY</code> so customer
                checkouts can read these protected recipient settings.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-cream-light p-6 sm:p-8">
        <div>
          <h2 className="font-display text-2xl text-ink">{copy.instagram}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            {copy.instagramHint}
          </p>
        </div>

        <InstagramGallerySettingsForm initialSettings={instagramSettings} />
      </section>
    </div>
  );
}

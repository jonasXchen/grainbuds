import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { getIsStaff } from "@/lib/staff";
import { logout } from "@/lib/actions/auth";
import { getNewOrderCount } from "@/lib/actions/admin";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy guarantees a session; this also confirms that the verified
  // email is in ORDER_ADMIN_EMAILS and its database staff record is active.
  const [isStaff, locale] = await Promise.all([getIsStaff(), getLocale()]);

  if (!isStaff) {
    return (
      <LocaleProvider locale={locale}>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-ink px-5 text-center text-cream">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream/10">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-sand" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="10.5" width="14" height="9" rx="2.5" />
            <path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 v2.5" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="font-display text-3xl">
          {locale === "de" ? "Kein Adminzugriff" : "No admin access"}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-cream/60">
          {locale === "de"
            ? "Diese E-Mail-Adresse ist nicht in ORDER_ADMIN_EMAILS für Grainbuds freigeschaltet."
            : "This email address is not enabled for Grainbuds in ORDER_ADMIN_EMAILS."}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full bg-cream px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-matcha"
          >
            {locale === "de" ? "Abmelden" : "Sign out"}
          </button>
        </form>
      </div>
      </LocaleProvider>
    );
  }

  const newOrderCount = await getNewOrderCount();

  return (
    <LocaleProvider locale={locale}>
      <div className="admin-shell flex min-h-dvh flex-col bg-cream md:flex-row">
        <AdminNav initialNewOrderCount={newOrderCount} />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </LocaleProvider>
  );
}

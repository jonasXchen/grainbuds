import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { activateCurrentAdmin } from "@/lib/actions/auth";
import LoginForm from "@/components/admin/LoginForm";
import LanguageSwitcher from "@/components/site/LanguageSwitcher";
import { LocaleProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Staff login",
  robots: { index: false },
};

export default async function AdminLoginPage() {
  // Reuse an existing verified storefront session. If its email is on the
  // server-side admin allowlist, no second login or OTP is necessary.
  if (hasSupabaseEnv()) {
    const activation = await activateCurrentAdmin();
    if (activation.ok && activation.isAdmin) redirect("/admin");
  }

  const locale = await getLocale();
  return (
    <LocaleProvider locale={locale}>
      <div className="relative flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
        <div className="absolute right-5 top-5">
          <LanguageSwitcher />
        </div>
        <LoginForm configured={hasSupabaseEnv()} />
      </div>
    </LocaleProvider>
  );
}

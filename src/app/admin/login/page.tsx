import type { Metadata } from "next";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import LoginForm from "@/components/admin/LoginForm";
import LanguageSwitcher from "@/components/site/LanguageSwitcher";
import { LocaleProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Staff login",
  robots: { index: false },
};

export default async function AdminLoginPage() {
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

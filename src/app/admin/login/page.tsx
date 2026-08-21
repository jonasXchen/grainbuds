import type { Metadata } from "next";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Staff login",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
      <LoginForm configured={hasSupabaseEnv()} />
    </div>
  );
}

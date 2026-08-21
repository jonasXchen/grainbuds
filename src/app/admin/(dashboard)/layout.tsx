import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { getIsStaff } from "@/lib/staff";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy guarantees a session; this checks the account is actually on
  // the Grainbuds staff allowlist (other apps' users in the same Supabase
  // project are not).
  const isStaff = await getIsStaff();

  if (!isStaff) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-ink px-5 text-center text-cream">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream/10">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-sand" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="10.5" width="14" height="9" rx="2.5" />
            <path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 v2.5" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="font-display text-3xl">Not on the staff list</h1>
        <p className="max-w-sm text-sm leading-relaxed text-cream/60">
          This account is signed in, but it isn&apos;t registered as Grainbuds
          staff. Ask the owner to add it — the SQL snippet is in the README
          under &ldquo;Create the owner&apos;s login&rdquo;.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full bg-cream px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-matcha"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

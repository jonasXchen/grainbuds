import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream md:flex-row">
      <AdminNav />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

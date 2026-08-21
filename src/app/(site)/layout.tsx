import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/i18n/context";
import { AdminModeProvider } from "@/lib/admin-mode-context";
import { getLocale } from "@/lib/i18n/server";
import { getViewMode } from "@/lib/staff";
import SmoothScroll from "@/components/site/SmoothScroll";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CartDrawer from "@/components/site/CartDrawer";
import StaffBar from "@/components/site/StaffBar";
import CookieNotice from "@/components/site/CookieNotice";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, { isStaff, adminMode }] = await Promise.all([
    getLocale(),
    getViewMode(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <AdminModeProvider isAdmin={adminMode}>
        <CartProvider>
          <SmoothScroll>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScroll>
          <CartDrawer />
        </CartProvider>
        {isStaff && <StaffBar customerView={!adminMode} />}
        <CookieNotice />
      </AdminModeProvider>
    </LocaleProvider>
  );
}

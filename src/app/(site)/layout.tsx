import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/i18n/context";
import { AdminModeProvider } from "@/lib/admin-mode-context";
import { getLocale } from "@/lib/i18n/server";
import { getViewMode } from "@/lib/staff";
import SmoothScroll from "@/components/site/SmoothScroll";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CartDrawer from "@/components/site/CartDrawer";
import CookieNotice from "@/components/site/CookieNotice";
import CheckoutBar from "@/components/site/CheckoutBar";

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
            <Header isStaff={isStaff} customerView={!adminMode} />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScroll>
          <CartDrawer />
          <CheckoutBar />
        </CartProvider>
        <CookieNotice />
      </AdminModeProvider>
    </LocaleProvider>
  );
}

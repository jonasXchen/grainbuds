import { CartProvider } from "@/lib/cart-context";
import SmoothScroll from "@/components/site/SmoothScroll";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CartDrawer from "@/components/site/CartDrawer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <SmoothScroll>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </SmoothScroll>
      <CartDrawer />
    </CartProvider>
  );
}

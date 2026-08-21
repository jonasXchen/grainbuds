export type Locale = "en" | "de";

export type Category = {
  id: string;
  name: string;
  name_de?: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  name_de?: string;
  slug: string;
  description: string;
  description_de?: string;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
  category?: Category | null;
};

export type OrderStatus =
  | "new"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  notes: string | null;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  pickup_time: string | null;
  notes: string | null;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  order_items?: OrderItem[];
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export function formatPrice(cents: number, locale: Locale = "en"): string {
  return (cents / 100).toLocaleString(locale === "de" ? "de-DE" : "en-IE", {
    style: "currency",
    currency: "EUR",
  });
}

/** Product/category text in the requested language, falling back to English. */
export function localizedName(
  item: { name: string; name_de?: string | null },
  locale: Locale
): string {
  return locale === "de" && item.name_de ? item.name_de : item.name;
}

export function localizedDescription(
  product: { description: string; description_de?: string | null },
  locale: Locale
): string {
  return locale === "de" && product.description_de
    ? product.description_de
    : product.description;
}

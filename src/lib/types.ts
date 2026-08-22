export type Locale = "en" | "de";
export type FulfillmentType = "pickup" | "dine_in";

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
  /** null/undefined = not tracked (always available); 0 = sold out. */
  stock?: number | null;
  created_at?: string;
  category?: Category | null;
};

export function isSoldOut(product: Product): boolean {
  return product.stock != null && product.stock <= 0;
}

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
  fulfillment_type?: FulfillmentType;
  table_number?: number | null;
  order_source?: "website" | "qr_online" | "qr_table";
  qr_campaign?: string | null;
  notes: string | null;
  status: OrderStatus;
  total_cents: number;
  payment_status?: "unpaid" | "paid" | "refunded";
  payment_method?: "cash" | "card" | null;
  paid_at?: string | null;
  marketing_opt_in?: boolean;
  created_at: string;
  order_items?: OrderItem[];
};

export type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  created_at: string;
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

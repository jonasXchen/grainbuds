export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
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

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

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
  loyalty_eligible?: boolean;
  sort_order: number;
  /** null/undefined = not tracked (always available); 0 = sold out. */
  stock?: number | null;
  option_groups?: ProductOptionGroup[];
  created_at?: string;
  category?: Category | null;
};

export type ProductOptionChoice = {
  id: string;
  name: string;
  name_de?: string;
  price_delta_cents: number;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  name_de?: string;
  required: boolean;
  allow_multiple: boolean;
  options: ProductOptionChoice[];
};

export type SelectedProductOption = {
  group_id: string;
  group_name: string;
  group_name_de?: string;
  option_id: string;
  option_name: string;
  option_name_de?: string;
  price_delta_cents: number;
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
  loyalty_eligible?: boolean;
  selected_options?: SelectedProductOption[];
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
  loyalty_reward_cents?: number;
  loyalty_reward_product_id?: string | null;
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
  id: string;
  product: Product;
  quantity: number;
  selected_options: SelectedProductOption[];
};

export function cartLineUnitPrice(line: Pick<CartLine, "product" | "selected_options">): number {
  return line.product.price_cents + line.selected_options.reduce(
    (sum, option) => sum + option.price_delta_cents,
    0
  );
}

export function cartLineId(
  productId: string,
  selectedOptions: Pick<SelectedProductOption, "option_id">[]
): string {
  const optionIds = selectedOptions.map((option) => option.option_id).sort();
  return optionIds.length ? `${productId}:${optionIds.join(",")}` : productId;
}

export function formatPrice(cents: number, locale: Locale = "en"): string {
  return (cents / 100).toLocaleString(locale === "de" ? "de-DE" : "en-IE", {
    style: "currency",
    currency: "EUR",
  });
}

/** Product/category text in the requested language, falling back to the other language. */
export function localizedName(
  item: { name: string; name_de?: string | null },
  locale: Locale
): string {
  const english = item.name?.trim();
  const german = item.name_de?.trim();
  return locale === "de" ? german || english || "" : english || german || "";
}

export function localizedDescription(
  product: { description: string; description_de?: string | null },
  locale: Locale
): string {
  const english = product.description?.trim();
  const german = product.description_de?.trim();
  return locale === "de" ? german || english || "" : english || german || "";
}

export function localizedSelectedOption(
  option: Pick<SelectedProductOption, "option_name" | "option_name_de">,
  locale: Locale
): string {
  const english = option.option_name?.trim();
  const german = option.option_name_de?.trim();
  return locale === "de" ? german || english || "" : english || german || "";
}

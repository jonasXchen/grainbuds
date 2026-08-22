"use server";

import { revalidatePath } from "next/cache";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getProductBySlug } from "@/lib/data";
import { sendOrderNotification } from "@/lib/order-notifications";
import type { FulfillmentType, Order } from "@/lib/types";

export type CheckoutLine = {
  productId: string;
  slug: string;
  quantity: number;
};

export type CheckoutInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  pickupTime?: string;
  fulfillmentType?: FulfillmentType;
  tableNumber?: number | null;
  orderSource?: "website" | "qr_online" | "qr_table";
  qrCampaign?: string | null;
  notes?: string;
  marketingOptIn?: boolean;
  lines: CheckoutLine[];
};

export type CheckoutResult =
  | { ok: true; orderId: string; demo: boolean }
  | { ok: false; error: string };

export type EditOrderState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export type QueueEstimate = {
  position: number;
  waitingMinutes: number;
  currentDrinkCount: number;
  queuedDrinkCount: number;
};

const DRINK_CATEGORY_SLUGS = new Set([
  "specialty-matcha",
  "matcha-refresher",
  "hojicha",
  "smoothies",
  "fruit-tea",
  "fruit-cloud",
  "tapioca-boba",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCheckoutEstimate(
  lines: CheckoutLine[]
): Promise<QueueEstimate | null> {
  if (!lines.length || lines.length > 50) return null;

  const products = await Promise.all(
    lines.map((line) => getProductBySlug(line.slug))
  );
  const currentDrinkCount = products.reduce((total, product, index) => {
    if (!product?.category || !DRINK_CATEGORY_SLUGS.has(product.category.slug)) {
      return total;
    }
    const quantity = Math.max(
      1,
      Math.min(20, Math.floor(lines[index].quantity || 1))
    );
    return total + quantity;
  }, 0);

  if (!hasSupabaseEnv()) {
    return {
      position: 1,
      waitingMinutes: Math.ceil((currentDrinkCount * 30) / 60),
      currentDrinkCount,
      queuedDrinkCount: 0,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grainbuds_queue_snapshot");
  if (error || !data || typeof data !== "object") {
    if (error) {
      console.error("Could not calculate checkout queue", {
        code: error.code,
        message: error.message,
      });
    }
    return null;
  }

  const snapshot = data as {
    active_orders?: number | string;
    queued_drinks?: number | string;
  };
  const activeOrders = Math.max(0, Number(snapshot.active_orders) || 0);
  const queuedDrinkCount = Math.max(0, Number(snapshot.queued_drinks) || 0);

  return {
    position: activeOrders + 1,
    waitingMinutes: Math.ceil(
      ((queuedDrinkCount + currentDrinkCount) * 30) / 60
    ),
    currentDrinkCount,
    queuedDrinkCount,
  };
}

export async function createOrder(
  input: CheckoutInput
): Promise<CheckoutResult> {
  if (!input.customerName?.trim() || !input.customerEmail?.trim()) {
    return { ok: false, error: "Please fill in your name and email." };
  }
  if (!input.lines?.length) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (input.lines.length > 50) {
    return { ok: false, error: "Too many items in one order." };
  }

  // Re-price every line on the server — never trust client prices.
  const priced = [];
  for (const line of input.lines) {
    const quantity = Math.max(1, Math.min(20, Math.floor(line.quantity)));
    const product = await getProductBySlug(line.slug);
    if (!product) {
      return {
        ok: false,
        error: "An item in your cart is no longer available.",
      };
    }
    // Friendly pre-check; the database trigger is the hard guarantee.
    if (product.stock != null && product.stock < quantity) {
      return {
        ok: false,
        error:
          product.stock <= 0
            ? `“${product.name}” is sold out right now.`
            : `Only ${product.stock} × “${product.name}” left — please lower the quantity.`,
      };
    }
    priced.push({ product, quantity });
  }
  const totalCents = priced.reduce(
    (sum, line) => sum + line.product.price_cents * line.quantity,
    0
  );
  const fulfillmentType: FulfillmentType =
    input.fulfillmentType === "dine_in" ? "dine_in" : "pickup";
  const tableNumber =
    fulfillmentType === "dine_in" &&
    Number.isInteger(input.tableNumber) &&
    Number(input.tableNumber) >= 1 &&
    Number(input.tableNumber) <= 999
      ? Number(input.tableNumber)
      : null;
  const orderSource =
    input.orderSource === "qr_table" && tableNumber
      ? "qr_table"
      : input.orderSource === "qr_online"
        ? "qr_online"
        : "website";
  const qrCampaign =
    orderSource.startsWith("qr_") &&
    input.qrCampaign?.match(/^[a-z0-9-]{1,60}$/)
      ? input.qrCampaign
      : null;

  if (!hasSupabaseEnv()) {
    // Demo mode: no database connected yet.
    return { ok: true, orderId: "demo", demo: true };
  }

  const supabase = await createClient();
  const orderId = crypto.randomUUID();
  const { error } = await supabase
    .from("grainbuds_orders")
    .insert({
      id: orderId,
      customer_name: input.customerName.trim().slice(0, 120),
      customer_email: input.customerEmail.trim().slice(0, 200),
      customer_phone: input.customerPhone?.trim().slice(0, 40) || null,
      pickup_time: input.pickupTime?.trim().slice(0, 80) || null,
      fulfillment_type: fulfillmentType,
      table_number: tableNumber,
      order_source: orderSource,
      qr_campaign: qrCampaign,
      notes: input.notes?.trim().slice(0, 500) || null,
      status: "new",
      total_cents: totalCents,
      marketing_opt_in: Boolean(input.marketingOptIn),
    });

  if (error) {
    // Do not log customer details, but retain the database diagnostics in the
    // server logs so production failures can be identified without exposing
    // them in the checkout UI.
    console.error("Could not create order", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return { ok: false, error: "Could not place the order. Please try again." };
  }

  const { error: itemsError } = await supabase.from("grainbuds_order_items").insert(
    priced.map((line) => ({
      order_id: orderId,
      product_id: line.product.id,
      product_name: line.product.name,
      unit_price_cents: line.product.price_cents,
      quantity: line.quantity,
    }))
  );

  if (itemsError) {
    console.error("Could not create order items", {
      orderId,
      code: itemsError.code,
      message: itemsError.message,
      details: itemsError.details,
    });
    // Most likely the stock trigger refused the sale (someone was faster).
    return {
      ok: false,
      error:
        "An item in your cart just sold out. Please review your cart and try again.",
    };
  }

  // Explicit opt-in only (GDPR): add them to the mailing list.
  if (input.marketingOptIn) {
    await supabase
      .from("grainbuds_subscribers")
      .upsert(
        {
          email: input.customerEmail.trim().toLowerCase().slice(0, 200),
          name: input.customerName.trim().slice(0, 120),
          source: "checkout",
        },
        { onConflict: "email", ignoreDuplicates: true }
      );
  }

  await sendOrderNotification("created", {
    id: orderId,
    customer_name: input.customerName.trim().slice(0, 120),
    customer_email: input.customerEmail.trim().toLowerCase().slice(0, 200),
    customer_phone: input.customerPhone?.trim().slice(0, 40) || null,
    pickup_time: input.pickupTime?.trim().slice(0, 80) || null,
    fulfillment_type: fulfillmentType,
    table_number: tableNumber,
    order_source: orderSource,
    qr_campaign: qrCampaign,
    notes: input.notes?.trim().slice(0, 500) || null,
    status: "new",
    total_cents: totalCents,
    payment_status: "unpaid",
    payment_method: null,
    order_items: priced.map((line) => ({
      product_name: line.product.name,
      unit_price_cents: line.product.price_cents,
      quantity: line.quantity,
    })),
  });

  return { ok: true, orderId, demo: false };
}

export async function updateCustomerOrder(
  _previousState: EditOrderState,
  formData: FormData
): Promise<EditOrderState> {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "")
    .trim()
    .toLowerCase();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const pickupTime = String(formData.get("pickup_time") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!UUID_PATTERN.test(orderId)) {
    return { ok: false, error: "This order link is invalid." };
  }
  if (!customerName || !customerEmail) {
    return { ok: false, error: "Please fill in your name and email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (
    customerName.length > 120 ||
    customerEmail.length > 200 ||
    customerPhone.length > 40 ||
    pickupTime.length > 80 ||
    notes.length > 500
  ) {
    return { ok: false, error: "One of the entered values is too long." };
  }
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Order editing is unavailable in demo mode." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grainbuds_update_order_details", {
    p_order_id: orderId,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
    p_customer_phone: customerPhone,
    p_pickup_time: pickupTime,
    p_notes: notes,
  });

  const order = data as Order | null;
  if (error || !order) {
    if (error) {
      console.error("Could not update customer order", {
        orderId,
        code: error.code,
        message: error.message,
      });
    }
    return {
      ok: false,
      error:
        "This order can no longer be edited, or the update could not be saved.",
    };
  }

  await sendOrderNotification("customer_updated", order);
  revalidatePath(`/order/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Your order details have been updated." };
}

"use server";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getProductBySlug } from "@/lib/data";

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
  notes?: string;
  marketingOptIn?: boolean;
  lines: CheckoutLine[];
};

export type CheckoutResult =
  | { ok: true; orderId: string; demo: boolean }
  | { ok: false; error: string };

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

  return { ok: true, orderId, demo: false };
}

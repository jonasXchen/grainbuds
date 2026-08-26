import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export type CustomerOrderHistory = {
  signedIn: boolean;
  orders: Order[];
};

type VerifiedUser = {
  id: string;
  email?: string | null;
};

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

async function claimGuestOrders(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  user: VerifiedUser
): Promise<void> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return;

  // Match case-insensitively for older orders, while escaping LIKE wildcard
  // characters that can legitimately occur in an email local-part.
  const { error } = await admin
    .from("grainbuds_orders")
    .update({ customer_user_id: user.id })
    .is("customer_user_id", null)
    .ilike("customer_email", escapeLikePattern(email));

  if (error) {
    console.error("Could not link guest orders to verified customer", {
      code: error.code,
      message: error.message,
    });
  }
}

/** Link unclaimed guest orders only after Supabase has verified the email. */
export async function claimGuestOrdersForVerifiedUser(
  user: VerifiedUser
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await claimGuestOrders(admin, user);
}

/**
 * Reads order history only after resolving the verified user from the server
 * session. The service client is then constrained to that exact user id, so
 * no customer identifier supplied by the browser is trusted.
 */
export async function getCustomerOrderHistory(): Promise<CustomerOrderHistory> {
  if (!hasSupabaseEnv()) return { signedIn: false, orders: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, orders: [] };

  const admin = createAdminClient();
  if (!admin) return { signedIn: true, orders: [] };

  // Fallback reconciliation for sessions created before automatic claiming
  // was introduced or if the initial claim temporarily failed.
  await claimGuestOrders(admin, user);

  const { data, error } = await admin
    .from("grainbuds_orders")
    .select(
      "id, customer_name, fulfillment_type, table_number, status, total_cents, loyalty_reward_cents, payment_status, created_at, order_items:grainbuds_order_items(id, order_id, product_id, product_name, unit_price_cents, quantity, notes, loyalty_eligible, selected_options)"
    )
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Could not load customer order history", {
      code: error.code,
      message: error.message,
    });
    return { signedIn: true, orders: [] };
  }

  return { signedIn: true, orders: (data as Order[] | null) ?? [] };
}

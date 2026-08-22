import { createAdminClient } from "@/lib/supabase/admin";
import { cafeInfo } from "@/lib/cafe-info";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type OrderNotificationEvent =
  | "created"
  | "customer_updated"
  | "status_updated";

type NotificationOrder = Pick<
  Order,
  | "id"
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "pickup_time"
  | "fulfillment_type"
  | "table_number"
  | "order_source"
  | "qr_campaign"
  | "notes"
  | "status"
  | "total_cents"
  | "payment_status"
  | "payment_method"
> & {
  order_items?: Array<
    Pick<OrderItem, "product_name" | "unit_price_cents" | "quantity">
  >;
};

type NotificationContext = {
  previousStatus?: OrderStatus;
};

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  in_progress: "In progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const fulfillmentLabels = {
  pickup: "Pickup",
  dine_in: "Dine in",
} as const;

function parseRecipientList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

async function getAdminRecipients(): Promise<string[]> {
  const adminClient = createAdminClient();
  if (adminClient) {
    const { data, error } = await adminClient
      .from("grainbuds_settings")
      .select("value")
      .eq("key", "order_notification_emails")
      .maybeSingle();
    if (!error) {
      const configured = parseRecipientList(data?.value);
      if (configured.length) return [...new Set(configured)].slice(0, 50);
    } else {
      console.error("Could not read order notification settings", {
        code: error.code,
        message: error.message,
      });
    }
  }

  return [...new Set(
    (process.env.ORDER_ADMIN_EMAILS ?? "")
      .split(/[\n,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )].slice(0, 50);
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function orderDetails(order: NotificationOrder): string {
  const items = (order.order_items ?? [])
    .map(
      (item) =>
        `${item.quantity} × ${item.product_name} — ${formatPrice(
          item.unit_price_cents * item.quantity
        )}`
    )
    .join("\n");

  return [
    `Order: ${order.id}`,
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    order.customer_phone ? `Phone: ${order.customer_phone}` : null,
    order.pickup_time ? `Pickup: ${order.pickup_time}` : null,
    `Order type: ${fulfillmentLabels[order.fulfillment_type ?? "pickup"]}`,
    order.table_number ? `Table: ${order.table_number}` : null,
    order.qr_campaign ? `QR campaign: ${order.qr_campaign}` : null,
    `Status: ${statusLabels[order.status]}`,
    order.payment_status
      ? `Payment: ${order.payment_status}${
          order.payment_method ? ` (${order.payment_method})` : ""
        }`
      : null,
    "",
    items || "No order items available.",
    `Total: ${formatPrice(order.total_cents)}`,
    order.notes ? `\nNotes: ${order.notes}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function subjects(
  event: OrderNotificationEvent,
  order: NotificationOrder,
  context: NotificationContext
) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  switch (event) {
    case "created":
      return {
        customer: `Your Grainbuds order ${shortId} is confirmed`,
        admin: `New Grainbuds order ${shortId}`,
        intro: "A new order has been placed.",
      };
    case "customer_updated":
      return {
        customer: `Your Grainbuds order ${shortId} was updated`,
        admin: `Customer updated order ${shortId}`,
        intro: "The customer updated their order details.",
      };
    case "status_updated":
      return {
        customer: `Grainbuds order ${shortId}: ${statusLabels[order.status]}`,
        admin: `Order ${shortId} status: ${statusLabels[order.status]}`,
        intro: `Status changed from ${
          context.previousStatus ? statusLabels[context.previousStatus] : "Unknown"
        } to ${statusLabels[order.status]}.`,
      };
  }
}

/**
 * Sends transactional notifications without making order operations depend on
 * email availability. Errors are recorded in server logs and never fail the
 * customer/admin action that triggered them.
 */
export async function sendOrderNotification(
  event: OrderNotificationEvent,
  order: NotificationOrder,
  context: NotificationContext = {}
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Order email skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const sendToCustomer =
    event === "created" ||
    (event === "status_updated" &&
      (order.status === "new" || order.status === "cancelled"));
  const sendToStaff =
    event === "created" ||
    event === "customer_updated" ||
    (event === "status_updated" && order.status === "new");

  if (!sendToCustomer && !sendToStaff) return;

  const adminRecipients = sendToStaff ? await getAdminRecipients() : [];
  const from =
    process.env.ORDER_FROM_EMAIL ||
    process.env.MARKETING_FROM_EMAIL ||
    "Grainbuds <onboarding@resend.dev>";
  const siteUrl = "https://grainbuds.de";
  const viewUrl = `${siteUrl}/order/${order.id}`;
  const copy = subjects(event, order, context);
  const details = orderDetails(order);

  const messages: Array<{
    from: string;
    to: string[];
    subject: string;
    text: string;
  }> = [];

  if (sendToCustomer) {
    messages.push({
      from,
      to: [order.customer_email],
      subject: copy.customer,
      text: `${copy.intro}\n\n${details}\n\nView or edit your order: ${viewUrl}\nDirections to Grainbuds: ${cafeInfo.mapsUrl}\n\nGrainbuds · Universitätsstraße 7, 91054 Erlangen`,
    });
  }

  if (sendToStaff && adminRecipients.length) {
    messages.push({
      from,
      to: adminRecipients,
      subject: copy.admin,
      text: `${copy.intro}\n\n${details}\n\nOpen the order: ${viewUrl}\nDirections to Grainbuds: ${cafeInfo.mapsUrl}`,
    });
  } else if (sendToStaff) {
    console.warn("Admin order email skipped: no notification recipients configured.");
  }

  try {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "grainbuds-order-notifications/1.0",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Could not send order notification", {
        event,
        orderId: order.id,
        status: response.status,
        detail: detail.slice(0, 300),
      });
    }
  } catch (error) {
    console.error("Could not send order notification", {
      event,
      orderId: order.id,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

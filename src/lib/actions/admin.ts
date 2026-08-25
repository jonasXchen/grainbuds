"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/order-notifications";
import {
  normalizeInstagramHandle,
  parseInstagramGallerySettings,
} from "@/lib/instagram-gallery";
import { safeReturnPath } from "@/lib/return-path";
import type { Order, OrderStatus } from "@/lib/types";
import { isAdminEmail } from "@/lib/admin-emails";

export type ActionState =
  | { error: string; message?: never }
  | { message: string; error?: never }
  | null;
export type SettingsActionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

async function requireAdmin() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");
  // A session alone isn't enough: the verified email must be configured and
  // its mirrored grainbuds_staff row must still pass database RLS.
  const { data: isStaff } = await supabase.rpc("grainbuds_is_staff");
  if (isStaff !== true) redirect("/admin");
  return supabase;
}

export async function getNewOrderCount(): Promise<number> {
  const supabase = await requireAdmin();
  const { count, error } = await supabase
    .from("grainbuds_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) {
    console.error("Could not count new orders", {
      code: error.code,
      message: error.message,
    });
    return 0;
  }
  return count ?? 0;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("grainbuds-product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("grainbuds-product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const returnTo = safeReturnPath(formData.get("return_to"));
  const nameInput = String(formData.get("name") ?? "").trim();
  const nameDe = String(formData.get("name_de") ?? "").trim();
  const fallbackName = nameInput || nameDe;
  const descriptionInput = String(formData.get("description") ?? "").trim();
  const descriptionDe = String(formData.get("description_de") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const isActive = formData.get("is_active") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const imageFile = formData.get("image") as File | null;
  const removeImage = formData.get("remove_image") === "on";

  if (!fallbackName) {
    return { error: "Please give the product a German or English name." };
  }
  const price = Number.parseFloat(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Please enter a valid price, e.g. 6.50." };
  }
  let stock: number | null = null;
  if (stockRaw !== "") {
    stock = Number.parseInt(stockRaw, 10);
    if (!Number.isFinite(stock) || stock < 0) {
      return { error: "Stock must be a whole number (or empty for unlimited)." };
    }
  }

  let imageUrl: string | null | undefined = undefined;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      return { error: "Image is too large — please use one under 5 MB." };
    }
    imageUrl = await uploadImage(supabase, imageFile);
    if (!imageUrl) return { error: "Image upload failed. Please try again." };
  } else if (removeImage) {
    imageUrl = null;
  }

  const row: Record<string, unknown> = {
    name: nameInput.slice(0, 120),
    name_de: nameDe.slice(0, 120),
    description: descriptionInput.slice(0, 1000),
    description_de: descriptionDe.slice(0, 1000),
    price_cents: Math.round(price * 100),
    category_id: categoryId,
    is_active: isActive,
    is_featured: isFeatured,
    stock,
  };
  if (imageUrl !== undefined) row.image_url = imageUrl;

  if (id) {
    const { error } = await supabase.from("grainbuds_products").update(row).eq("id", id);
    if (error) return { error: "Could not save the product." };
  } else {
    // Make the slug unique if a product with the same name already exists.
    const base = slugify(fallbackName) || "product";
    const { data: clash } = await supabase
      .from("grainbuds_products")
      .select("id")
      .eq("slug", base)
      .maybeSingle();
    row.slug = clash ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
    const { error } = await supabase.from("grainbuds_products").insert(row);
    if (error) return { error: "Could not create the product." };
  }

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("grainbuds_products").delete().eq("id", id);
    revalidatePath("/", "layout");
  }
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (id) {
    await supabase.from("grainbuds_products").update({ is_active: next }).eq("id", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
  }
}

export async function adjustStock(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const delta = Number.parseInt(String(formData.get("delta") ?? "0"), 10);
  if (!id || !Number.isFinite(delta) || delta === 0) return;
  const { data: product } = await supabase
    .from("grainbuds_products")
    .select("stock")
    .eq("id", id)
    .maybeSingle();
  if (!product || product.stock == null) return;
  await supabase
    .from("grainbuds_products")
    .update({ stock: Math.max(0, product.stock + delta) })
    .eq("id", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}

export async function addCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const nameInput = String(formData.get("name") ?? "").trim();
  const nameDe = String(formData.get("name_de") ?? "").trim();
  const fallbackName = nameInput || nameDe;
  if (!fallbackName) return { error: "Please enter a German or English category name." };
  const { data: lastCategory } = await supabase
    .from("grainbuds_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("grainbuds_categories").insert({
    name: nameInput.slice(0, 80),
    name_de: nameDe.slice(0, 80),
    slug: slugify(fallbackName) || `category-${crypto.randomUUID().slice(0, 6)}`,
    sort_order: (lastCategory?.sort_order ?? -1) + 1,
  });
  if (error) return { error: "Could not add the category (name may already exist)." };
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  return { message: `Added “${fallbackName.slice(0, 80)}”.` };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nameInput = String(formData.get("name") ?? "").trim();
  const nameDe = String(formData.get("name_de") ?? "").trim();
  const fallbackName = nameInput || nameDe;
  if (!id || !fallbackName) {
    return { error: "Please enter a German or English category name." };
  }

  const { error } = await supabase
    .from("grainbuds_categories")
    .update({ name: nameInput.slice(0, 80), name_de: nameDe.slice(0, 80) })
    .eq("id", id);
  if (error) return { error: "Could not update the category." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  return { message: "Category names saved." };
}

export async function reorderCategories(categoryIds: string[]) {
  const supabase = await requireAdmin();
  const uniqueIds = [...new Set(categoryIds)];
  if (!uniqueIds.length || uniqueIds.length > 100) return;

  const { data: categories, error } = await supabase
    .from("grainbuds_categories")
    .select("id")
    .order("sort_order")
    .order("created_at");
  if (error || !categories) return;
  if (
    categories.length !== uniqueIds.length ||
    categories.some((category) => !uniqueIds.includes(category.id))
  ) return;

  const results = await Promise.all(
    uniqueIds.map((id, sortOrder) =>
      supabase
        .from("grainbuds_categories")
        .update({ sort_order: sortOrder })
        .eq("id", id)
    )
  );
  if (results.some((result) => result.error)) return;

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("grainbuds_categories").delete().eq("id", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
  }
}

export async function updateOrderPayment(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("payment") ?? "");
  // Encoded as "status:method", e.g. "paid:cash", "unpaid:", "refunded:".
  const [status, method] = value.split(":");
  if (!id) return;
  if (!["unpaid", "paid", "refunded"].includes(status)) return;
  if (method && !["cash", "card"].includes(method)) return;
  const { data: existing } = await supabase
    .from("grainbuds_orders")
    .select("*, order_items:grainbuds_order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return;

  const nextPaymentMethod = method || null;
  if (
    existing.payment_status === status &&
    existing.payment_method === nextPaymentMethod
  ) {
    return;
  }

  const paidAt = status === "paid" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("grainbuds_orders")
    .update({
      payment_status: status,
      payment_method: nextPaymentMethod,
      paid_at: paidAt,
    })
    .eq("id", id);
  if (error) return;

  revalidatePath("/admin/orders");
  revalidatePath(`/order/${id}`);
}

export async function updateOrderStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const allowed: OrderStatus[] = [
    "new",
    "in_progress",
    "ready",
    "completed",
    "cancelled",
  ];
  if (id && allowed.includes(status)) {
    const { data: existing } = await supabase
      .from("grainbuds_orders")
      .select("*, order_items:grainbuds_order_items(*)")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.status === status) return;

    const { error } = await supabase
      .from("grainbuds_orders")
      .update({ status })
      .eq("id", id);
    if (error) return;

    if (status === "new" || status === "cancelled") {
      await sendOrderNotification(
        "status_updated",
        { ...(existing as Order), status },
        { previousStatus: existing.status as OrderStatus }
      );
    }
    revalidatePath("/admin/orders");
    revalidatePath(`/order/${id}`);
  }
}

export async function saveOrderNotificationEmails(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await requireAdmin();
  const raw = String(formData.get("emails") ?? "");
  const emails = [...new Set(
    raw
      .split(/[\n,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )];

  if (!emails.length) {
    return { ok: false, error: "Add at least one notification email." };
  }
  if (emails.length > 50) {
    return { ok: false, error: "You can configure up to 50 recipients." };
  }
  const invalid = emails.find(
    (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200
  );
  if (invalid) {
    return { ok: false, error: `“${invalid}” is not a valid email address.` };
  }

  const { error } = await supabase.from("grainbuds_settings").upsert(
    {
      key: "order_notification_emails",
      value: emails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) {
    console.error("Could not save order notification emails", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: "Could not save the notification emails." };
  }

  revalidatePath("/admin/settings");
  return {
    ok: true,
    message: `Saved ${emails.length} notification recipient${
      emails.length === 1 ? "" : "s"
    }.`,
  };
}

export async function saveInstagramGallerySettings(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await requireAdmin();
  const handleInput = String(formData.get("handle") ?? "");
  const handle = normalizeInstagramHandle(handleInput);
  if (!handle) {
    return { ok: false, error: "Enter a valid Instagram handle or profile URL." };
  }

  const lines = String(formData.get("images") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const uploadedUrls = formData
    .getAll("uploaded_urls")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (lines.length + uploadedUrls.length > 8) {
    return { ok: false, error: "Add no more than eight gallery images." };
  }

  const rawImages = lines.map((line) => {
    const [imageUrl = "", postUrl = ""] = line.split("|", 2).map((part) => part.trim());
    return { imageUrl, postUrl: postUrl || null };
  }).concat(uploadedUrls.map((imageUrl) => ({ imageUrl, postUrl: null })));
  const parsed = parseInstagramGallerySettings({ handle, images: rawImages });
  if (parsed.images.length !== rawImages.length) {
    return {
      ok: false,
      error: "Every gallery entry must contain a valid HTTPS image URL and optional HTTPS post URL.",
    };
  }

  const { error } = await supabase.from("grainbuds_settings").upsert(
    {
      key: "instagram_gallery",
      value: { handle: parsed.handle, images: parsed.images },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) {
    console.error("Could not save Instagram gallery settings", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: "Could not save the Instagram gallery." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return {
    ok: true,
    message: parsed.images.length
      ? `Saved @${parsed.handle} with ${parsed.images.length} gallery image${parsed.images.length === 1 ? "" : "s"}.`
      : `Saved @${parsed.handle}. The existing café photos remain visible.`,
  };
}

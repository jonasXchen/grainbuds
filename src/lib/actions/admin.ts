"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type ActionState = { error: string } | null;

async function requireAdmin() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
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
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(/[^0-9.]/g, "");
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const isActive = formData.get("is_active") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const imageFile = formData.get("image") as File | null;
  const removeImage = formData.get("remove_image") === "on";

  if (!name) return { error: "Please give the product a name." };
  const price = Number.parseFloat(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Please enter a valid price, e.g. 6.50." };
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
    name: name.slice(0, 120),
    description: description.slice(0, 1000),
    price_cents: Math.round(price * 100),
    category_id: categoryId,
    is_active: isActive,
    is_featured: isFeatured,
  };
  if (imageUrl !== undefined) row.image_url = imageUrl;

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { error: "Could not save the product." };
  } else {
    // Make the slug unique if a product with the same name already exists.
    const base = slugify(name) || "product";
    const { data: clash } = await supabase
      .from("products")
      .select("id")
      .eq("slug", base)
      .maybeSingle();
    row.slug = clash ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
    const { error } = await supabase.from("products").insert(row);
    if (error) return { error: "Could not create the product." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("products").delete().eq("id", id);
    revalidatePath("/", "layout");
  }
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (id) {
    await supabase.from("products").update({ is_active: next }).eq("id", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
  }
}

export async function addCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a category name." };
  const { error } = await supabase.from("categories").insert({
    name: name.slice(0, 80),
    slug: slugify(name) || `category-${crypto.randomUUID().slice(0, 6)}`,
    sort_order: 99,
  });
  if (error) return { error: "Could not add the category (name may already exist)." };
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  return null;
}

export async function deleteCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("categories").delete().eq("id", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
  }
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
    await supabase.from("orders").update({ status }).eq("id", id);
    revalidatePath("/admin/orders");
  }
}

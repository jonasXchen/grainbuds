import "server-only";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export type InstagramGalleryImage = {
  imageUrl: string;
  postUrl: string | null;
};

export type InstagramGallerySettings = {
  handle: string;
  profileUrl: string;
  images: InstagramGalleryImage[];
};

export const DEFAULT_INSTAGRAM_HANDLE = "grainbuds_erlangen";

export function normalizeInstagramHandle(value: string): string | null {
  let handle = value.trim();

  try {
    const url = new URL(handle);
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;
    handle = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } catch {
    handle = handle.replace(/^@/, "").split(/[/?#]/)[0] ?? "";
  }

  return /^[a-zA-Z0-9._]{1,30}$/.test(handle) ? handle.toLowerCase() : null;
}

export function parseInstagramGallerySettings(
  value: unknown
): InstagramGallerySettings {
  const record = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
  const handle =
    typeof record.handle === "string"
      ? normalizeInstagramHandle(record.handle) ?? DEFAULT_INSTAGRAM_HANDLE
      : DEFAULT_INSTAGRAM_HANDLE;
  const images = Array.isArray(record.images)
    ? record.images.flatMap((item): InstagramGalleryImage[] => {
        if (!item || typeof item !== "object") return [];
        const image = item as Record<string, unknown>;
        if (typeof image.imageUrl !== "string") return [];
        try {
          const imageUrl = new URL(image.imageUrl);
          if (imageUrl.protocol !== "https:") return [];
          const postUrl = typeof image.postUrl === "string" && image.postUrl
            ? new URL(image.postUrl)
            : null;
          if (postUrl && postUrl.protocol !== "https:") return [];
          return [{
            imageUrl: imageUrl.toString(),
            postUrl: postUrl?.toString() ?? null,
          }];
        } catch {
          return [];
        }
      }).slice(0, 8)
    : [];

  return {
    handle,
    profileUrl: `https://www.instagram.com/${handle}/`,
    images,
  };
}

export async function getInstagramGallerySettings(): Promise<InstagramGallerySettings> {
  if (!hasSupabaseEnv()) return parseInstagramGallerySettings(null);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grainbuds_get_instagram_gallery");
  if (error) {
    console.error("Could not load Instagram gallery settings", {
      code: error.code,
      message: error.message,
    });
    return parseInstagramGallerySettings(null);
  }

  return parseInstagramGallerySettings(data);
}

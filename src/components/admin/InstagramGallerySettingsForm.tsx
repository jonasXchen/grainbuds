"use client";

import { useActionState, useState } from "react";
import {
  saveInstagramGallerySettings,
  type SettingsActionState,
} from "@/lib/actions/admin";
import type { InstagramGallerySettings } from "@/lib/instagram-gallery";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export default function InstagramGallerySettingsForm({
  initialSettings,
}: {
  initialSettings: InstagramGallerySettings;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(saveInstagramGallerySettings, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageLines = initialSettings.images
    .map(({ imageUrl, postUrl }) => postUrl ? `${imageUrl} | ${postUrl}` : imageUrl)
    .join("\n");

  async function saveWithUploads(formData: FormData) {
    setUploadError(null);
    const files = formData
      .getAll("uploads")
      .filter((value): value is File => value instanceof File && value.size > 0);
    formData.delete("uploads");
    const listedImageCount = String(formData.get("images") ?? "")
      .split("\n")
      .filter((line) => line.trim()).length;

    if (listedImageCount + files.length > 8) {
      setUploadError("Keep no more than eight gallery images in total.");
      return;
    }
    if (files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) {
      setUploadError("Upload JPG, PNG, WebP, or AVIF images only.");
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setUploadError("Each image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `gallery/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from("grainbuds-product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage
          .from("grainbuds-product-images")
          .getPublicUrl(path);
        formData.append("uploaded_urls", data.publicUrl);
      }
      formAction(formData);
    } catch (error) {
      console.error("Could not upload Instagram gallery image", error);
      setUploadError("The image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={saveWithUploads} className="mt-6 space-y-5">
      <div>
        <label htmlFor="instagram-handle" className="block text-sm font-medium text-ink">
          Instagram handle or profile URL
        </label>
        <input
          id="instagram-handle"
          name="handle"
          type="text"
          required
          defaultValue={initialSettings.handle}
          placeholder="grainbuds_erlangen"
          className="mt-3 w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm text-ink outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
        />
      </div>

      <div>
        <label htmlFor="instagram-uploads" className="block text-sm font-medium text-ink">
          Upload photos
        </label>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          Select one or several photos. New uploads are added to the images
          already listed below. Maximum 5 MB per photo and eight photos total.
        </p>
        <input
          id="instagram-uploads"
          name="uploads"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="mt-3 block w-full rounded-2xl border border-dashed border-ink/20 bg-white px-4 py-4 text-sm text-ink/65 file:mr-4 file:rounded-full file:border-0 file:bg-matcha/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-matcha-deep hover:file:bg-matcha/30"
        />
      </div>

      <div>
        <label htmlFor="instagram-images" className="block text-sm font-medium text-ink">
          Existing images and post links
        </label>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          Each line contains an image URL. You can remove a line to remove that
          photo, or add a vertical bar followed by its Instagram post URL to
          make the photo open that post.
        </p>
        <textarea
          id="instagram-images"
          name="images"
          rows={7}
          defaultValue={imageLines}
          placeholder={"https://images.example.com/photo.jpg | https://www.instagram.com/p/POST/"}
          className="mt-3 w-full resize-y rounded-2xl border border-ink/15 bg-white px-5 py-4 font-mono text-xs leading-relaxed text-ink outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
        />
      </div>

      {uploadError && (
        <p aria-live="polite" className="rounded-2xl bg-red-50 px-5 py-3.5 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      {state && (
        <p
          aria-live="polite"
          className={`rounded-2xl px-5 py-3.5 text-sm ${
            state.ok ? "bg-matcha/15 text-matcha-deep" : "bg-red-50 text-red-700"
          }`}
        >
          {state.ok ? state.message : state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60"
      >
        {uploading ? "Uploading…" : pending ? "Saving…" : "Save Instagram gallery"}
      </button>
    </form>
  );
}

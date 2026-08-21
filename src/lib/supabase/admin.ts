import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Server-only Supabase client for reading protected application settings from
 * customer-triggered Server Actions. Never import this module from a Client
 * Component and never expose SUPABASE_SECRET_KEY through NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) return null;

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

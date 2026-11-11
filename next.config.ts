import type { NextConfig } from "next";

// The public Supabase values are inlined at build time. An automated build
// without them would not fail: it would quietly publish the demo catalogue
// with no database behind it. Stop that build instead.
const isAutomatedBuild = Boolean(process.env.WORKERS_CI || process.env.CI);
const hasPublicSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);
if (isAutomatedBuild && !hasPublicSupabaseEnv) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be " +
      "set as build variables (Cloudflare: Worker → Settings → Build → " +
      "Variables and secrets). Refusing to build the demo site for production."
  );
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "grainbuds.vercel.app" }],
        destination: "https://grainbuds.de/:path*",
        permanent: true,
      },
      {
        // One canonical host, so session cookies are never split across two.
        source: "/:path*",
        has: [{ type: "host", value: "www.grainbuds.de" }],
        destination: "https://grainbuds.de/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

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

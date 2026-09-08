import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep tracing scoped to the frontend package when a parent workspace has
  // another lockfile (otherwise Next may pick the wrong project root).
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;

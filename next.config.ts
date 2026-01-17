import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to support server-side auth routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

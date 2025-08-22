import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;

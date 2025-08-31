// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <- indispensable pour le Dockerfile proposé

  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    unoptimized: true, // ⬅️ plus d’appel à /_next/image
  },
  poweredByHeader: false, // petit hardening prod
};

export default nextConfig;

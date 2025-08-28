// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <- indispensable pour le Dockerfile proposé
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      // En prod, ajoute ton domaine si tu seras en HTTPS :
      // { protocol: "https", hostname: "ton-domaine.tld" },
    ],
  },
  poweredByHeader: false, // petit hardening prod
};

export default nextConfig;

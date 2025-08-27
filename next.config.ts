// next.config.ts
import type { NextConfig } from "next";

// Déduit le hostname de prod à partir de NEXT_PUBLIC_SITE_URL (si présent)
function getProdHost() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const PROD_HOST = getProdHost();

const nextConfig: NextConfig = {
  // ▶ nécessaire pour l’image Docker "standalone"
  output: "standalone",

  experimental: {
    // aligne avec ta limite d'upload côté admin (on avait mis 8 Mo)
    serverActions: { bodySizeLimit: "8mb" },
  },

  images: {
    // Si tu n’affiches que des images locales (/public/...), rien à changer.
    // Mais si tu utilises des URLs absolues vers ton domaine, autorise-le ici.
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      ...(PROD_HOST
        ? [{ protocol: "https", hostname: PROD_HOST } as const]
        : []),
    ],
  },
};

export default nextConfig;

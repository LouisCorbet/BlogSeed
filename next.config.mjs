/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build standalone pour une image Docker légère
  output: "standalone",

  images: {
    // Formats modernes générés à la volée
    formats: ["image/avif", "image/webp"],
    // Les images uploadées sont servies localement depuis /uploads
    remotePatterns: [],
  },

  // On retire le header X-Powered-By
  poweredByHeader: false,

  experimental: {
    // Les Server Actions sont stables, mais l'option de configuration
    // bodySizeLimit reste sous experimental.serverActions.
    // Relevé à 10mb pour les uploads d'images (couvertures, avatars).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

/**
 * robots.txt dynamique. Next.js le sert à /robots.txt.
 * On bloque l'admin, l'API et les pages de recherche/redirection.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/recherche", "/go/", "/login", "/register", "/invite/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

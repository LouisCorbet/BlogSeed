import type { Metadata } from "next";
import "./globals.css";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { AuthProvider } from "@/components/auth/auth-provider";

// Métadonnées de base — enrichies par generateMetadata sur chaque page.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings([
    SETTING_KEYS.BLOG_TITLE,
    SETTING_KEYS.BLOG_DESCRIPTION,
  ]);

  const title = settings[SETTING_KEYS.BLOG_TITLE] ?? "Mon Blog";
  const description =
    settings[SETTING_KEYS.BLOG_DESCRIPTION] ?? "Un blog propulsé par Next.js";

  return {
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    alternates: {
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

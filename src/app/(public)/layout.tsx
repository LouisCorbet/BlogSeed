import { getSettings, getJSONSetting, SETTING_KEYS } from "@/lib/settings";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Layout commun à toutes les pages publiques.
 *
 * - Injecte les variables CSS de thème configurées depuis l'admin
 *   (couleurs, radius, police). La structure complète du thème sera
 *   pilotée en Phase 10 ; ici on lit déjà THEME_CONFIG s'il existe.
 * - Pose header + footer autour du contenu.
 */

interface ThemeConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    foreground?: string;
    link?: string;
  };
  radius?: string;
  font?: string;
}

function buildThemeCss(theme: ThemeConfig): string {
  const c = theme.colors ?? {};
  const vars: string[] = [];
  if (c.primary) vars.push(`--color-primary:${c.primary}`);
  if (c.secondary) vars.push(`--color-secondary:${c.secondary}`);
  if (c.background) vars.push(`--color-background:${c.background}`);
  if (c.foreground) vars.push(`--color-foreground:${c.foreground}`);
  if (c.link) vars.push(`--color-link:${c.link}`);
  if (theme.radius) vars.push(`--radius-base:${theme.radius}`);
  if (theme.font) vars.push(`--font-base:${theme.font}`);
  if (vars.length === 0) return "";
  return `:root{${vars.join(";")}}`;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, theme] = await Promise.all([
    getSettings([SETTING_KEYS.BLOG_TITLE]),
    getJSONSetting<ThemeConfig>(SETTING_KEYS.THEME_CONFIG, {}),
  ]);

  const blogTitle = settings[SETTING_KEYS.BLOG_TITLE] ?? "Mon Blog";
  const themeCss = buildThemeCss(theme);

  return (
    <>
      {themeCss ? <style dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <SiteHeader blogTitle={blogTitle} />
        <main style={{ flex: 1, width: "100%", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

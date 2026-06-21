import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings, getJSONSetting, SETTING_KEYS } from "@/lib/settings";

/**
 * Pied de page : pages légales affichées selon inFooter + order (configurable
 * depuis l'admin en Phase 10), liens sociaux et titre du blog.
 */
export async function SiteFooter() {
  const [pages, settings, socialLinks] = await Promise.all([
    prisma.page.findMany({
      where: { inFooter: true },
      select: { title: true, slug: true },
      orderBy: { order: "asc" },
    }),
    getSettings([SETTING_KEYS.BLOG_TITLE]),
    getJSONSetting<Record<string, string>>(SETTING_KEYS.BLOG_SOCIAL_LINKS, {}),
  ]);

  const blogTitle = settings[SETTING_KEYS.BLOG_TITLE] ?? "Mon Blog";
  const socialEntries = Object.entries(socialLinks).filter(([, url]) => url);

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(127,127,127,0.2)",
        padding: "2rem 1.5rem",
        marginTop: "3rem",
        fontSize: "0.85rem",
        opacity: 0.85,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>{blogTitle}</p>
          <p style={{ margin: 0, opacity: 0.7 }}>
            © {new Date().getFullYear()} {blogTitle}
          </p>
        </div>

        {pages.length > 0 ? (
          <nav>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {pages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {socialEntries.length > 0 ? (
          <nav>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {socialEntries.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </footer>
  );
}

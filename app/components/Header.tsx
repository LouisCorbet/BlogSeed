// app/components/Header.tsx  ← **Server Component**
import { readSiteSettings, SiteSettings } from "@/lib/siteSettings.server";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const s = await readSiteSettings();

  // On tolère l’absence de logo et on retombe sur le favicon
  const logoSrc = (s as SiteSettings).headerLogo || "/";
  const name = s.name;
  const subTitle = s.subTitle || "";

  return <HeaderClient logoSrc={logoSrc} name={name} subTitle={subTitle} />;
}

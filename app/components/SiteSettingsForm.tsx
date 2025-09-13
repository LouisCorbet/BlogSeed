// app/components/SiteSettingsForm.tsx
import Image from "next/image";
import { saveSiteSettings } from "@/app/admin/actions";
import { DaisyThemes, type SiteSettings } from "@/lib/siteSettings";

export default function SiteSettingsForm({
  settings,
}: {
  settings: SiteSettings;
}) {
  // petit helper de preview
  const Preview = ({ src, alt }: { src?: string; alt: string }) => (
    <div className="relative rounded border border-base-300 overflow-hidden w-16 h-16 sm:w-20 sm:h-20">
      <Image
        src={src || "/favicon.ico"}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 64px, 80px"
        priority
      />
    </div>
  );

  return (
    <div className=" bg-base-100 ">
      <h2 className="card-title">Paramètres du site</h2>
      <p className="text-sm text-base-content/70">
        Nom, URL, description… Ces infos alimentent vos <strong>metas</strong>{" "}
        (SEO) et l’interface.
      </p>

      <form action={saveSiteSettings} className="grid gap-6 sm:gap-7 mt-6">
        {/* Thème + email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label">
              <span className="label-text">Thème DaisyUI</span>
              <span className="label-text-alt text-base-content/60">
                Appliqué sur &lt;html data-theme=&quot;…&quot; /&gt;
              </span>
            </span>
            <select
              name="theme"
              className="select select-bordered w-full"
              defaultValue={settings.theme ?? "light"}
            >
              {DaisyThemes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label">
              <span className="label-text">Email de contact</span>
            </span>
            <input
              name="contactEmail"
              type="email"
              placeholder="contact@exemple.com"
              defaultValue={settings.contactEmail ?? ""}
              className="input input-bordered w-full"
              autoComplete="email"
            />
          </label>
        </div>

        {/* Texte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label">
              <span className="label-text">Tagline (description courte)</span>
            </span>
            <input
              name="tagline"
              type="text"
              defaultValue={settings.tagline}
              className="input input-bordered w-full"
            />
          </label>

          <label className="form-control">
            <span className="label">
              <span className="label-text">Sous-titre</span>
            </span>
            <input
              name="subTitle"
              type="text"
              defaultValue={settings.subTitle}
              className="input input-bordered w-full"
            />
          </label>
        </div>

        <label className="form-control">
          <span className="label">
            <span className="label-text">À propos</span>
          </span>
          <textarea
            name="about"
            defaultValue={settings.about}
            className="textarea textarea-bordered w-full"
            rows={3}
          />
        </label>

        {/* Bloc images : OG / Header / Home */}
        <div className="grid gap-6">
          {/* OG */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
            <div className="sm:pt-8">
              <Preview src={settings.defaultOg} alt="Aperçu OG" />
            </div>
            <div className="grid gap-3">
              <label className="form-control">
                <span className="label">
                  <span className="label-text">Image OG par défaut</span>
                  <span className="label-text-alt text-base-content/60">
                    JPG, PNG, WEBP · max 8 Mo
                  </span>
                </span>
                <input
                  name="defaultOgFile"
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                />
              </label>
            </div>
          </div>

          {/* Header logo */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
            <div className="sm:pt-8">
              {settings.headerLogo && (
                <Preview src={settings.headerLogo} alt="Aperçu Header Logo" />
              )}
            </div>
            <label className="form-control">
              <span className="label">
                <span className="label-text">Logo Header</span>
                <span className="label-text-alt text-base-content/60">
                  JPG, PNG, WEBP · max 8 Mo
                </span>
              </span>
              <input
                name="headerLogoFile"
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
              />
            </label>
          </div>

          {/* Home logo */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
            <div className="sm:pt-8">
              {settings.homeLogo && (
                <Preview src={settings.homeLogo} alt="Aperçu Home Logo" />
              )}
            </div>
            <label className="form-control">
              <span className="label">
                <span className="label-text">Logo Accueil</span>
                <span className="label-text-alt text-base-content/60">
                  JPG, PNG, WEBP · max 8 Mo
                </span>
              </span>
              <input
                name="homeLogoFile"
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
              />
            </label>
          </div>

          {/* Favicon */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
            <div className="sm:pt-8">
              <Preview src={settings.favicon} alt="Aperçu Favicon" />
            </div>
            <label className="form-control">
              <span className="label">
                <span className="label-text">Favicon</span>
                <span className="label-text-alt text-base-content/60">
                  .ICO recommandé
                </span>
              </span>
              <input
                name="faviconFile"
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
              />
            </label>
          </div>
        </div>

        <div className="card-actions pt-2">
          <button type="submit" className="btn btn-primary w-full sm:w-auto">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

// app/components/SiteSettingsForm.tsx
import Image from "next/image";
import { saveSiteSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/siteSettings";

export default function SiteSettingsForm({
  settings,
}: {
  settings: SiteSettings;
}) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Paramètres du site</h2>
        <p className="text-sm text-base-content/70">
          Nom, URL, description, réseaux… Ces informations alimentent vos{" "}
          <strong>metas</strong> (SEO) et l’interface.
        </p>

        <form action={saveSiteSettings} className="grid gap-3">
          <label className="form-control">
            <span className="label">
              <span className="label-text">Tagline (description courte)</span>
            </span>
            <input
              name="tagline"
              type="text"
              defaultValue={settings.tagline}
              className="input input-bordered"
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
              className="input input-bordered"
            />
          </label>

          <label className="form-control">
            <span className="label">
              <span className="label-text">À Propos</span>
            </span>
            <input
              name="about"
              type="text"
              defaultValue={settings.about}
              className="input input-bordered"
            />
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            {/* <label className="form-control">
              <span className="label">
                <span className="label-text">Twitter / X</span>
              </span>
              <input
                name="twitter"
                type="text"
                placeholder="@handle ou URL"
                defaultValue={settings.twitter ?? ""}
                className="input input-bordered"
              />
            </label> */}

            <label className="form-control">
              <span className="label">
                <span className="label-text">Email de contact</span>
              </span>
              <input
                name="contactEmail"
                type="email"
                placeholder="contact@exemple.com"
                defaultValue={settings.contactEmail ?? ""}
                className="input input-bordered"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] items-end gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">
                  Image OG par défaut (chemin public)
                </span>
                <span className="label-text-alt text-base-content/60">
                  ex. /images/og.jpg
                </span>
              </span>
              <div className="flex items-center gap-3">
                {settings.defaultOg && (
                  <div className="w-16 h-16 relative rounded overflow-hidden border border-base-300">
                    <Image
                      src={settings.defaultOg}
                      alt="Aperçu OG"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <label className="form-control">
            <span className="label">
              <span className="label-text">
                …ou téléverser une nouvelle image OG
              </span>
              <span className="label-text-alt text-base-content/60">
                JPG, PNG, WEBP · max 8&nbsp;Mo
              </span>
            </span>
            <input
              name="defaultOgFile"
              type="file"
              accept="image/*"
              className="file-input file-input-bordered"
            />
          </label>

          <div className="grid md:grid-cols-[1fr_auto] items-end gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Logo Header</span>
                {/* <span className="label-text-alt text-base-content/60">
                  ex. /images/og.jpg
                </span> */}
              </span>
              <div className="flex items-center gap-3">
                {settings.headerLogo && (
                  <div className="w-16 h-16 relative rounded overflow-hidden border border-base-300">
                    <Image
                      src={settings.headerLogo}
                      alt="Aperçu Header Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <label className="form-control">
            <span className="label">
              <span className="label-text">
                …ou téléverser un nouveau logo pour le header
              </span>
              <span className="label-text-alt text-base-content/60">
                JPG, PNG, WEBP · max 8&nbsp;Mo
              </span>
            </span>
            <input
              name="headerLogoFile"
              type="file"
              accept="image/*"
              className="file-input file-input-bordered"
            />
          </label>

          <div className="grid md:grid-cols-[1fr_auto] items-end gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Logo Accueil</span>
                {/* <span className="label-text-alt text-base-content/60">
                  ex. /images/og.jpg
                </span> */}
              </span>
              <div className="flex items-center gap-3">
                {settings.homeLogo && (
                  <div className="w-16 h-16 relative rounded overflow-hidden border border-base-300">
                    <Image
                      src={settings.homeLogo}
                      alt="Aperçu Home Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <label className="form-control">
            <span className="label">
              <span className="label-text">
                …ou téléverser un nouveau logo pour l&apos;accueil
              </span>
              <span className="label-text-alt text-base-content/60">
                JPG, PNG, WEBP · max 8&nbsp;Mo
              </span>
            </span>
            <input
              name="homeLogoFile"
              type="file"
              accept="image/*"
              className="file-input file-input-bordered"
            />
          </label>

          <div className="grid md:grid-cols-[1fr_auto] items-end gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Favicon</span>
                {/* <span className="label-text-alt text-base-content/60">
                  ex. /images/og.jpg
                </span> */}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 relative rounded overflow-hidden border border-base-300">
                  <Image
                    src={settings.favicon || ""}
                    alt="Aperçu Favicon"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </label>
          </div>

          <label className="form-control">
            <span className="label">
              <span className="label-text">
                …ou téléverser un nouveau favicon
              </span>
              <span className="label-text-alt text-base-content/60">.ICO</span>
            </span>
            <input
              name="faviconFile"
              type="file"
              accept="image/*"
              className="file-input file-input-bordered"
            />
          </label>

          <div className="card-actions justify-end pt-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

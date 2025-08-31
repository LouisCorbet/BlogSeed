import React from "react";
import Image from "next/image";
import { saveArticle } from "../admin/actions";

type Article = {
  id: string;
  slug: string;
  title: string;
  author: string;
  date?: string;
  imgPath?: string;
  imageAlt?: string;
  catchphrase?: string;
  html?: string;
};

export default function ArticleForm({ article }: { article?: Article }) {
  const isEdit = Boolean(article);

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
    <div id="article-form" className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="card-title">
              {isEdit ? "Modifier l’article" : "Nouvel article"}
            </h2>
            <p className="text-sm text-base-content/70">
              {isEdit
                ? "Mets à jour les métadonnées et le contenu."
                : "Renseigne les métadonnées et colle le HTML de l’article."}
            </p>
          </div>

          {isEdit && (
            <a href="/admin" className="btn btn-ghost btn-sm self-start">
              Annuler
            </a>
          )}
        </div>

        <form
          action={saveArticle}
          encType="multipart/form-data"
          className="grid gap-6"
        >
          <input type="hidden" name="id" value={isEdit ? article?.id : ""} />

          {/* Métadonnées de base */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Slug</span>
                <span className="label-text-alt text-base-content/60">
                  ex. mon-article
                </span>
              </span>
              <input
                type="text"
                name="slug"
                placeholder="mon-article"
                required
                pattern="[a-z0-9-]+"
                defaultValue={article?.slug ?? ""}
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Titre</span>
              </span>
              <input
                type="text"
                name="title"
                placeholder="Titre de l’article"
                required
                defaultValue={article?.title ?? ""}
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Auteur</span>
              </span>
              <input
                type="text"
                name="author"
                placeholder="Nom de l’auteur"
                required
                defaultValue={article?.author ?? ""}
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Date</span>
                <span className="label-text-alt text-base-content/60">
                  YYYY-MM-DD
                </span>
              </span>
              <input
                type="date"
                name="date"
                defaultValue={article?.date ?? ""}
                className="input input-bordered w-full"
              />
            </label>
          </div>

          {/* Aperçu + Upload image */}
          {isEdit && article?.imgPath && (
            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
              <div className="sm:pt-8">
                <Preview src={article.imgPath} alt={article.title} />
              </div>
              <div className="text-xs text-base-content/60 break-all">
                Image actuelle : <code>{article.imgPath}</code>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Image de couverture</span>
                <span className="label-text-alt text-base-content/60">
                  JPG, PNG, WEBP · max 8&nbsp;Mo
                </span>
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                required={!isEdit}
              />
            </label>
          </div>

          {/* ALT + Accroche */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Texte alternatif (ALT)</span>
              </span>
              <input
                type="text"
                name="imageAlt"
                placeholder="Description de l'image"
                defaultValue={article?.imageAlt ?? ""}
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Accroche</span>
              </span>
              <input
                type="text"
                name="catchphrase"
                placeholder="Accroche de l’article"
                defaultValue={article?.catchphrase ?? ""}
                className="input input-bordered w-full"
              />
            </label>
          </div>

          {/* Contenu HTML */}
          <label className="form-control">
            <span className="label">
              <span className="label-text">Contenu HTML</span>
            </span>
            <textarea
              name="htmlContent"
              rows={12}
              placeholder="<h1>Mon Titre</h1><p>Mon contenu…</p>"
              required
              defaultValue={article?.html ?? ""}
              className="textarea textarea-bordered font-mono w-full"
            />
          </label>

          <div className="card-actions pt-2">
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              {isEdit ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

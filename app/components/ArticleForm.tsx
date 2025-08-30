import React from "react";
import Image from "next/image";
import { saveArticle } from "../admin/actions";

// Ajuste si tu as un type fort côté store
type Article = {
  id: string;
  slug: string;
  title: string;
  author: string;
  date?: string;
  imgPath?: string;
  imageAlt?: string;
  catchphrase?: string;
  html?: string; // injecté par la page admin via getHTML
};

export default function ArticleForm({ article }: { article?: Article }) {
  const isEdit = Boolean(article);

  return (
    <div id="article-form" className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="card-title">
              {isEdit ? "Modifier l’article" : "Nouvel article"}
            </h2>
            <p className="text-sm text-base-content/70 grow-0">
              {isEdit
                ? "Mets à jour les métadonnées et le contenu."
                : "Renseigne les métadonnées et colle le HTML de l’article."}
            </p>
          </div>

          {isEdit && (
            <a href="/admin" className="btn btn-ghost btn-sm">
              Annuler
            </a>
          )}
        </div>

        <form action={saveArticle} className="grid gap-3 justify-center w-full">
          <input type="hidden" name="id" value={isEdit ? article?.id : ""} />

          <label className="form-control flex flex-col">
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
              className="input input-bordered"
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Titre</span>
            </span>
            <input
              type="text"
              name="title"
              placeholder="Titre de l’article"
              required
              defaultValue={article?.title ?? ""}
              className="input input-bordered"
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Auteur</span>
            </span>
            <input
              type="text"
              name="author"
              placeholder="Nom de l’auteur"
              required
              defaultValue={article?.author ?? ""}
              className="input input-bordered"
            />
          </label>

          {/* Aperçu image existante si édition */}
          {isEdit && article?.imgPath && (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 relative rounded overflow-hidden border border-base-300">
                <Image
                  src={article.imgPath}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-base-content/60">
                Image actuelle : <code>/{article.imgPath}</code>
              </span>
            </div>
          )}

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Image de couverture</span>
              <span className="label-text-alt text-base-content/60">
                JPG, PNG, WEBP (max 8 Mo)
              </span>
            </span>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="file-input file-input-bordered"
              // Image requise uniquement en création
              required={!isEdit}
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Texte alternatif (ALT)</span>
            </span>
            <input
              type="text"
              name="imageAlt"
              placeholder="Description de l'image"
              defaultValue={article?.imageAlt ?? ""}
              className="input input-bordered"
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Accroche</span>
            </span>
            <input
              type="text"
              name="catchphrase"
              placeholder="Accroche de l’article"
              defaultValue={article?.catchphrase ?? ""}
              className="input input-bordered"
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Contenu HTML</span>
            </span>
            <textarea
              name="htmlContent"
              rows={12}
              placeholder="<h1>Mon Titre</h1><p>Mon contenu…</p>"
              required
              defaultValue={article?.html ?? ""}
              className="textarea textarea-bordered font-mono"
            />
          </label>

          <div className="card-actions justify-end pt-2">
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

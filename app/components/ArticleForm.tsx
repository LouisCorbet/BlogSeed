import React from "react";
import { saveArticle } from "../admin/actions";

export default function ArticleForm() {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Nouvel article</h2>
        <p className="text-sm text-base-content/70 grow-0">
          Renseigne les métadonnées et colle le <strong>HTML</strong> de
          l’article.
        </p>
        <form action={saveArticle} className="grid gap-3 justify-center w-full">
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
              className="input input-bordered"
            />
          </label>
          {/* 
              <label className="form-control flex flex-col">
                <span className="label">
                  <span className="label-text">Date (optionnelle)</span>
                </span>
                <input
                  type="date"
                  name="date"
                  className="input input-bordered"
                />
              </label> */}

          {/* Image upload */}
          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Image de couverture</span>
              <span className="label-text-alt text-base-content/60">
                JPG, PNG, WEBP (max 8 Mo)
              </span>
            </span>
            <input
              required
              type="file"
              name="image"
              accept="image/*"
              className="file-input file-input-bordered"
            />
          </label>

          <label className="form-control flex flex-col">
            <span className="label">
              <span className="label-text">Texte alternatif (ALT)</span>
            </span>
            <input
              type="text"
              name="imageAlt"
              placeholder="Description de l’image"
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
              className="textarea textarea-bordered font-mono"
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

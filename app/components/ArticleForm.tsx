"use client";

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

  // --- State contrôlé ---
  const [slug, setSlug] = React.useState(article?.slug ?? "");
  const [title, setTitle] = React.useState(article?.title ?? "");
  const [author, setAuthor] = React.useState(article?.author ?? "");
  const [date, setDate] = React.useState(article?.date ?? "");
  const [imageAlt, setImageAlt] = React.useState(article?.imageAlt ?? "");
  const [catchphrase, setCatchphrase] = React.useState(
    article?.catchphrase ?? ""
  );
  const [htmlContent, setHtmlContent] = React.useState(article?.html ?? "");
  const [showPreview, setShowPreview] = React.useState(false);

  // --- SYNC quand l’article change (ex: on clique "éditer" sur une ligne) ---
  React.useEffect(() => {
    setSlug(article?.slug ?? "");
    setTitle(article?.title ?? "");
    setAuthor(article?.author ?? "");
    setDate(article?.date ?? "");
    setImageAlt(article?.imageAlt ?? "");
    setCatchphrase(article?.catchphrase ?? "");
    setHtmlContent(article?.html ?? "");
  }, [article]); // clé: on resynchronise à chaque article différent

  // --- Preview image upload ---
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null
  );
  React.useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Format date FR pour l’aperçu
  const formatDateISOFrUTC = (iso?: string) => {
    if (!iso) return "";
    const asISO = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso;
    const d = new Date(asISO);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  const PreviewThumb = ({ src, alt }: { src?: string; alt: string }) => (
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
    <div id="article-form" className="grid gap-6">
      {/* Formulaire */}
      <div>
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
              Quitter la modification
            </a>
          )}
        </div>

        {/* IMPORTANT: pas d'encType quand action est une server action */}
        <form action={saveArticle} className="grid gap-6">
          <input type="hidden" name="id" value={isEdit ? article?.id : ""} />

          {/* Métadonnées */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/*
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input input-bordered w-full"
                />
              </label>
                  */}

            <label className="form-control">
              <span className="label">
                <span className="label-text">Titre</span>
              </span>
              <input
                type="text"
                name="title"
                placeholder="Titre de l’article"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
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
                value={
                  date
                    ? /^\d{4}-\d{2}-\d{2}$/.test(date)
                      ? date
                      : new Date(date).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
          </div>

          {/* Aperçu + Upload image existante */}
          {isEdit && article?.imgPath && (
            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] items-start gap-4">
              <div className="sm:pt-8">
                <PreviewThumb src={article.imgPath} alt={article.title} />
              </div>
              <div className="text-xs text-base-content/60 break-all">
                Image actuelle : <code>{article.imgPath}</code>
              </div>
            </div>
          )}

          {/* Upload nouvelle image */}
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
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
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
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
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
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
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
      <div className="card-actions pt-2 flex justify-end">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Masquer l’aperçu" : "Afficher l’aperçu"}
        </button>
      </div>
      {showPreview && (
        <div>
          <section className="bg-base-100 border-b border-base-300 -mx-6 -mt-6 mb-6 px-6 py-6 rounded-t-xl">
            <div className="grid md:grid-cols-2 gap-6 items-center justify-items-center md:justify-items-start">
              {(imagePreviewUrl || (isEdit && article?.imgPath)) && (
                <img
                  src={imagePreviewUrl || article?.imgPath || ""}
                  alt={imageAlt || title || slug || "aperçu"}
                  width={300}
                  height={300}
                  className="w-[90vw] md:w-[300px] h-auto object-contain rounded-xl"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  {title || "(Titre de l’article)"}
                </h1>
                {(date || author) && (
                  <p className="mt-3 text-sm text-base-content/60">
                    {date && <>Publié le {formatDateISOFrUTC(date)}</>}
                    {date && author && " — "}
                    {author && (
                      <>
                        par <span className="font-medium">{author}</span>
                      </>
                    )}
                  </p>
                )}
                {catchphrase && (
                  <p className="mt-2 text-base-content/80">{catchphrase}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div>
              <div
                className="prose prose-neutral md:prose-lg max-w-none
                             prose-headings:font-semibold
                             prose-a:text-primary hover:prose-a:opacity-90
                             prose-img:rounded-xl
                             prose-code:bg-base-200 prose-code:px-1.5 prose-code:rounded
                             prose-pre:bg-base-200 prose-pre:border prose-pre:border-base-300
                             prose-hr:border-base-300"
                dangerouslySetInnerHTML={{
                  __html:
                    htmlContent ||
                    "<p class='opacity-60'>Prévisualisation du contenu…</p>",
                }}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

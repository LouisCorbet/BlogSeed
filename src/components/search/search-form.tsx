"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Facet {
  name: string | null;
  slug: string | null;
}

/**
 * Formulaire de recherche : mots-clés + filtres (catégorie, tag, auteur,
 * plage de dates). Soumet en mettant à jour l'URL (?q=...&categorie=...),
 * ce qui permet le partage du lien et l'indexation.
 */
export function SearchForm({
  categories,
  tags,
  authors,
}: {
  categories: Facet[];
  tags: Facet[];
  authors: Facet[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [categorie, setCategorie] = useState(params.get("categorie") ?? "");
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [auteur, setAuteur] = useState(params.get("auteur") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function submit() {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (categorie) next.set("categorie", categorie);
    if (tag) next.set("tag", tag);
    if (auteur) next.set("auteur", auteur);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    router.push(`/recherche?${next.toString()}`);
  }

  const field: React.CSSProperties = {
    padding: "0.5rem",
    borderRadius: "var(--radius-base)",
    border: "1px solid rgba(127,127,127,0.3)",
    background: "transparent",
    color: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="Rechercher un article ou un quizz…"
        style={{ ...field, fontSize: "1rem" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem" }}>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={field}>
          <option value="">Toutes catégories</option>
          {categories.map((c) => c.slug ? <option key={c.slug} value={c.slug}>{c.name}</option> : null)}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={field}>
          <option value="">Tous tags</option>
          {tags.map((t) => t.slug ? <option key={t.slug} value={t.slug}>{t.name}</option> : null)}
        </select>
        <select value={auteur} onChange={(e) => setAuteur(e.target.value)} style={field}>
          <option value="">Tous auteurs</option>
          {authors.map((a) => a.slug ? <option key={a.slug} value={a.slug}>{a.name}</option> : null)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={field} aria-label="Depuis" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={field} aria-label="Jusqu'à" />
      </div>
      <button
        type="button"
        onClick={submit}
        style={{ padding: "0.6rem 1.2rem", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-base)", cursor: "pointer", fontWeight: 600, alignSelf: "flex-start" }}
      >
        Rechercher
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * Boutons de partage social : X (Twitter), LinkedIn, et copie du lien.
 * Réutilisé sur la page article et sur la page de résultat de quizz (Phase 5).
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible (contexte non sécurisé) — on ignore.
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: "0.4rem 0.75rem",
    border: "1px solid currentColor",
    borderRadius: "var(--radius-base)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "0.85rem",
    textDecoration: "none",
    display: "inline-block",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>Partager :</span>
      <a href={links.x} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        X
      </a>
      <a href={links.linkedin} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        LinkedIn
      </a>
      <button type="button" onClick={copyLink} style={btnStyle}>
        {copied ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/content";

/**
 * Table des matières générée depuis les H2/H3 de l'article.
 * Met en surbrillance la section actuellement visible (IntersectionObserver)
 * et permet une navigation par ancre.
 */
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table des matières" style={{ fontSize: "0.9rem" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Sommaire</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: h.level === 3 ? "1rem" : 0, marginBottom: "0.25rem" }}
          >
            <a
              href={`#${h.id}`}
              style={{
                color: activeId === h.id ? "var(--color-primary)" : "inherit",
                fontWeight: activeId === h.id ? 600 : 400,
                textDecoration: "none",
                opacity: activeId === h.id ? 1 : 0.75,
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

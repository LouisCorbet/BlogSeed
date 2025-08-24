// app/components/HeaderClient.tsx  ← **Client Component**
"use client";

import Link from "next/link";
import Image from "next/image";

type Props = {
  logoSrc: string; // ex. "/images/logo.png" ou "/favicon.ico"
  name: string; // ex. "Mon Blog"
  subTitle: string; // ex. "Explorer, apprendre et partager"
};

export default function HeaderClient({ logoSrc, name, subTitle }: Props) {
  return (
    <header className="bg-base-300 shadow-md ">
      {/* barre du haut */}
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + lien accueil */}
        <Link href="/" className="flex items-center" aria-label="Accueil">
          <Image
            src={logoSrc}
            alt={`${name} — Accueil`}
            width={40}
            height={40}
            className="rounded-md"
            priority
          />
        </Link>

        {/* Nom + slogan */}
        <div className="items-center flex-col flex text-center">
          <span className="text-xl font-bold block">{name}</span>
          <span className="text-sm text-base-content/70">{subTitle}</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/contact" className="btn btn-outline btn-sm">
            Contact
          </Link>
        </div>
      </div>

      {/* fil d’ariane (si tu veux le réactiver, c’était déjà prêt) */}
      {/*
      <div className="bg-base-200 h-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="breadcrumbs text-sm p-0">
            <ul>
              <li><Link href="/">Accueil</Link></li>
              {parts.map((part, i) => {
                const href = "/" + parts.slice(0, i + 1).join("/");
                return (
                  <li key={href}>
                    <Link href={href} className="capitalize">
                      {decodeURIComponent(part)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      */}
    </header>
  );
}

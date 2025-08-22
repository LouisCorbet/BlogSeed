"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <header className="bg-base-300 shadow-md ">
      {/* barre du haut */}
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + titre + slogan */}
        <Link href="/" className="flex items-center">
          <Image
            src="/favicon.ico" // à placer dans /public/logo.png
            alt="Accueil"
            width={40}
            height={40}
            className="rounded-md"
          />
        </Link>
        <div className="items-center flex-col flex">
          <span className="text-xl font-bold block">Mon Blog</span>
          <span className="text-sm text-base-content/70">
            Explorer, apprendre et partager
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/contact" className="btn btn-outline btn-sm">
            Contact
          </Link>
        </div>
      </div>

      {/* fil d’ariane (en bas du header) */}
      {/* <div className="bg-base-200  h-5 ">
        <div className="max-w-6xl mx-auto px-4">
          <div className="breadcrumbs text-sm p-0">
            <ul>
              <li>
                <Link href="/">Accueil</Link>
              </li>
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
      </div> */}
    </header>
  );
}

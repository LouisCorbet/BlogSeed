"use client";

import Link from "next/link";
import Image from "next/image";

type Article = {
  slug: string;
  title: string;
  author: string;
  date: string;
  imgPath?: string;
  catchphrase?: string;
};

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="card bg-base-100 shadow-sm transition-transform duration-200 hover:scale-105 cursor-pointer hover:shadow-md"
    >
      {article.imgPath && (
        <figure className="relative w-full h-40">
          <Image
            src={`/${article.imgPath}`}
            alt={article.title}
            fill
            className="object-cover rounded-t"
          />
        </figure>
      )}
      <div className="card-body">
        <h3 className="card-title leading-snug">{article.title}</h3>
        <p className="text-sm text-base-content/60">
          {new Date(article.date).toLocaleDateString("fr-FR")} ·{" "}
          {article.author}
        </p>
        {article.catchphrase && (
          <p className="mt-2 text-sm text-base-content/70 line-clamp-3">
            {article.catchphrase}
          </p>
        )}
      </div>
    </Link>
  );
}

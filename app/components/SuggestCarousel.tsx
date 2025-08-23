"use client";

import Link from "next/link";
import ArticleCard from "./ArticleCard";

export type SuggestItem = {
  slug: string;
  title: string;
  author: string;
  date: string;
  imgPath?: string;
};

export default function SuggestCarousel({ items }: { items: SuggestItem[] }) {
  return (
    <div className="overflow-x-auto pb-2 [scrollbar-gutter:stable]">
      <ul
        role="list"
        className="p-2 flex gap-4 snap-x snap-mandatory"
        aria-label="Articles suggérés"
      >
        {items.map((a) => (
          <li
            key={a.slug}
            role="listitem"
            className="snap-start shrink-0 basis-[260px] max-w-[260px]"
          >
            <ArticleCard article={a} key={a.slug} />
          </li>
        ))}
      </ul>
    </div>
  );
}

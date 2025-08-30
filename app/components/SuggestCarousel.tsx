"use client";

import ArticleCard from "./ArticleCard";
import { Article } from "@/lib/store";

export default function SuggestCarousel({ items }: { items: Article[] }) {
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

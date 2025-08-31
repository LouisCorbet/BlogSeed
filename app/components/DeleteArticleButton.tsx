"use client";

import React from "react";
import { useFormStatus } from "react-dom";

type Props = {
  title: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  confirmMessage?: string;
};

export default function DeleteArticleButton({
  title,
  size = "xs",
  className = "",
  confirmMessage,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`btn btn-error ${size ? `btn-${size}` : ""} ${className}`}
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (pending) {
          e.preventDefault();
          return;
        }
        const msg = confirmMessage ?? `Supprimer "${title}" ?`;
        if (!confirm(msg)) e.preventDefault();
      }}
      title={pending ? "Suppression en cours…" : `Supprimer "${title}"`}
    >
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

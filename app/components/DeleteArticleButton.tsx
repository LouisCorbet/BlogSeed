"use client";
import React from "react";

const DeleteArticleButton = ({ title }: { title: string }) => {
  return (
    <button
      type="submit"
      className="btn btn-xs btn-error"
      onClick={(e) => {
        if (!confirm(`Supprimer "${title}" ?`)) e.preventDefault();
      }}
    >
      Supprimer
    </button>
  );
};

export default DeleteArticleButton;

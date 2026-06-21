"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { inviteAcceptSchema } from "@/lib/auth/schemas";

export function InviteForm({
  token,
  presetName,
  roles,
}: {
  token: string;
  presetName: string;
  roles: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: presetName,
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = inviteAcceptSchema.safeParse({ token, ...form });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...form }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    // Connexion automatique.
    const signInRes = await signIn("credentials", {
      email: data.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const roleLabels: Record<string, string> = {
    AUTHOR: "Auteur",
    EDITOR: "Éditeur",
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Vous êtes invité·e</h1>
        <p className="text-sm opacity-60">
          Rôle{roles.length > 1 ? "s" : ""} :{" "}
          {roles.map((r) => roleLabels[r] ?? r).join(", ")}
        </p>
      </div>

      {error && (
        <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nom affiché
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={update("name")}
            className="w-full rounded-theme border px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={update("password")}
            className="w-full rounded-theme border px-3 py-2"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            className="w-full rounded-theme border px-3 py-2"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-theme bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Création…" : "Rejoindre"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerSchema } from "@/lib/auth/schemas";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
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

    // Validation côté client (mêmes règles que le serveur).
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    // Inscription OK → connexion automatique.
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (signInRes?.error) {
      // Compte créé mais connexion échouée : renvoyer vers login.
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="text-sm opacity-60">Rejoignez la communauté</p>
      </div>

      {error && (
        <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nom
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={update("name")}
            className="w-full rounded-theme border px-3 py-2"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="w-full rounded-theme border px-3 py-2"
            autoComplete="email"
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
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-current opacity-10" />
            <span className="text-xs opacity-50">ou</span>
            <span className="h-px flex-1 bg-current opacity-10" />
          </div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-theme border px-4 py-2 font-medium"
          >
            Continuer avec Google
          </button>
        </>
      )}

      <p className="text-center text-sm opacity-60">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-link underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

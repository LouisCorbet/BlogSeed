"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-sm opacity-60">Accédez à votre compte</p>
      </div>

      {error && (
        <p className="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-theme border px-3 py-2"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-theme bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
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
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-theme border px-4 py-2 font-medium"
          >
            Continuer avec Google
          </button>
        </>
      )}

      <p className="text-center text-sm opacity-60">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-link underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}

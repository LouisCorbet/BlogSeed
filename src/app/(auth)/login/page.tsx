import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isGoogleEnabled } from "@/lib/auth/providers";
import { getCurrentUser } from "@/lib/auth/permissions";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default async function LoginPage() {
  // Déjà connecté → redirection accueil.
  const user = await getCurrentUser();
  if (user) redirect("/");

  const googleEnabled = await isGoogleEnabled();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Suspense>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </main>
  );
}

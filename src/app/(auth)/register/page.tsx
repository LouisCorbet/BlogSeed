import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isGoogleEnabled } from "@/lib/auth/providers";
import { getCurrentUser } from "@/lib/auth/permissions";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const googleEnabled = await isGoogleEnabled();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <RegisterForm googleEnabled={googleEnabled} />
    </main>
  );
}

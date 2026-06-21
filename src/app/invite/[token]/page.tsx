import type { Metadata } from "next";
import Link from "next/link";
import { getInvitation } from "@/lib/auth/invitations";
import { InviteForm } from "@/components/auth/invite-form";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitation(token);

  if (!invitation) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Invitation invalide</h1>
        <p className="opacity-60">
          Ce lien d&apos;invitation est invalide, a déjà été utilisé ou a
          expiré.
        </p>
        <Link href="/" className="text-link underline">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <InviteForm
        token={token}
        presetName={invitation.name ?? ""}
        roles={invitation.roles}
      />
    </main>
  );
}

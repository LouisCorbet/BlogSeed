"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Fournit le contexte de session aux composants client qui utilisent
 * useSession(). Enveloppe l'application dans le layout racine.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

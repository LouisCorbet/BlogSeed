import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * Augmentation des types Next-Auth :
 * on ajoute l'id et les rôles (cumulables) à la session et à l'utilisateur.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: Role[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: Role[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: Role[];
  }
}

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth/schemas";

/**
 * Configuration centrale Next-Auth v5.
 *
 * Stratégie : JWT (imposée par Credentials).
 *
 * Providers : Credentials toujours présent. Google chargé au démarrage
 * du module depuis les variables d'environnement OPTIONNELLES
 * AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET si présentes. Pour piloter Google
 * depuis la BDD, on synchronise ces variables d'environnement au moment
 * du (re)démarrage du container (voir note plus bas). On évite ainsi la
 * config asynchrone de NextAuth(), non supportée de façon fiable en v5
 * (cause de "adapterFn is not a function").
 *
 * Révocation des sessions : champ User.sessionVersion comparé dans le
 * callback jwt ; toute incrémentation invalide les tokens existants.
 */

function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ];

  // Google : activé si les credentials sont présents dans l'environnement.
  // (Synchronisés depuis la BDD au démarrage — voir syncGoogleEnv ci-dessous.)
  const googleId = process.env.AUTH_GOOGLE_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET;
  if (googleId && googleSecret) {
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: buildProviders(),

  callbacks: {
    async jwt({ token, user }) {
      // Première émission (au sign-in).
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { roles: true, sessionVersion: true },
        });
        token.id = user.id;
        token.roles = dbUser?.roles ?? ["READER"];
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
        return token;
      }

      // Requêtes suivantes : revalider contre la base.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { roles: true, sessionVersion: true },
        });
        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          return null; // utilisateur supprimé ou session révoquée
        }
        token.roles = dbUser.roles;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.roles =
          (token.roles as typeof session.user.roles) ?? ["READER"];
      }
      return session;
    },
  },
});

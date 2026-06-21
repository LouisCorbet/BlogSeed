import { handlers } from "@/lib/auth";

// Expose les endpoints d'authentification Next-Auth
// (/api/auth/signin, /api/auth/callback, /api/auth/session, etc.)
export const { GET, POST } = handlers;

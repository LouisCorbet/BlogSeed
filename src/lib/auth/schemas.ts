import { z } from "zod";

/**
 * Schémas de validation des entrées d'authentification.
 * Utilisés à la fois côté serveur (Server Actions, authorize) et
 * côté client (formulaires).
 */

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit faire au moins 2 caractères")
      .max(60, "Le nom est trop long"),
    email: z.string().email("Adresse email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
      .max(100, "Le mot de passe est trop long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const inviteAcceptSchema = z
  .object({
    token: z.string().min(1),
    name: z
      .string()
      .min(2, "Le nom doit faire au moins 2 caractères")
      .max(60, "Le nom est trop long"),
    password: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>;

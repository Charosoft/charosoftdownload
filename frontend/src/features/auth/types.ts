/** Utilisateur connecté, tel que renvoyé par le backend. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  /** Absent juste après une connexion ; rempli dès que le serveur répond. */
  plan?: "free" | "premium";
  premiumUntil?: string | null;
};
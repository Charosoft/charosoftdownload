/** Utilisateur connecté, tel que renvoyé par le backend. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

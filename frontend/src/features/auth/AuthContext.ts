import { createContext } from "react";

import type { AuthUser } from "./types";

export type AuthContextValue = {
  /** Utilisateur connecté, ou null. */
  user: AuthUser | null;
  /** true tant que la session n'a pas été vérifiée auprès du serveur. */
  loading: boolean;
  /** Met à jour l'utilisateur après une connexion ou une inscription. */
  setUser: (user: AuthUser | null) => void;
  /** Ferme la session (cookie supprimé côté serveur). */
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

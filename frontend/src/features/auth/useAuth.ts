import { useContext } from "react";

import { AuthContext } from "./AuthContext";

/** Donne accès à l'utilisateur connecté depuis n'importe quel composant. */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  }

  return context;
}

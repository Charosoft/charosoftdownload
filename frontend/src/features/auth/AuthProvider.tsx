import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { API_URL } from "../../lib/api";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./types";

/**
 * Garde en mémoire l'utilisateur connecté.
 * La session elle-même est dans un cookie sécurisé (httpOnly) géré par le
 * backend : ici on demande seulement « qui suis-je ? » au chargement.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = response.ok ? await response.json() : null;

        if (!controller.signal.aborted) setUser(data?.user ?? null);
      } catch {
        if (!controller.signal.aborted) setUser(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSession();

    return () => controller.abort();
  }, []);

    // Après une connexion ou une inscription, on récupère le plan (gratuit / premium).
  useEffect(() => {
    if (!user || user.plan) return;

    const controller = new AbortController();

    async function loadPlan() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = response.ok ? await response.json() : null;

        if (data?.user && !controller.signal.aborted) setUser(data.user);
      } catch {
        // Sans réponse, la personne garde le comportement « gratuit ».
      }
    }

    void loadPlan();

    return () => controller.abort();
  }, [user]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      // Si le serveur n'a pas fermé la session, on garde l'affichage connecté.
      if (!response.ok) return;
    } catch {
      return;
    }

    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, logout }),
    [user, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

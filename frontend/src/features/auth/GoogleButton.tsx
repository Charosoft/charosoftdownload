import { useEffect, useRef } from "react";

import { API_URL } from "../../lib/api";
import { GOOGLE_CLIENT_ID } from "../../lib/config";
import { useAuth } from "./useAuth";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type CredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, unknown>,
      ) => void;
    };
  };
};

function getGoogle(): GoogleIdentity | undefined {
  return (window as unknown as { google?: GoogleIdentity }).google;
}

/**
 * Bouton officiel « Continuer avec Google ».
 * Google renvoie un « credential » signé, que le backend vérifie avant
 * d'ouvrir la session (cookie sécurisé).
 */
export default function GoogleButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const { setUser } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (!clientId) return;

    let cancelled = false;

    async function handleCredential(response: CredentialResponse) {
      if (!response.credential) return;

      try {
        const result = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await result.json().catch(() => ({}));

        if (!result.ok) {
          throw new Error(data.message || "Connexion Google impossible.");
        }

        if (!data.user || typeof data.user.id !== "string") {
          throw new Error("Réponse de connexion invalide.");
        }

        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      } catch (error) {
        onErrorRef.current(
          error instanceof Error
            ? error.message
            : "Impossible de contacter le serveur.",
        );
      }
    }

    function renderButton() {
      const google = getGoogle();
      const container = containerRef.current;

      if (cancelled || !google || !container) return;

      google.accounts.id.initialize({
        client_id: clientId as string,
        callback: handleCredential,
      });

      container.innerHTML = "";

      google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        locale: "fr",
        width: Math.min(400, Math.max(200, container.clientWidth || 320)),
      });
    }

    if (getGoogle()) {
      renderButton();

      return () => {
        cancelled = true;
      };
    }

    // Charge le script de Google une seule fois, même si le composant se remonte.
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );

    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", renderButton);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderButton);
    };
  }, [setUser]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div ref={containerRef} className="flex min-h-[44px] justify-center" />
  );
}

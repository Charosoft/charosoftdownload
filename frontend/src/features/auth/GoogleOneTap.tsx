import { useEffect } from "react";

import { API_URL } from "../../lib/api";
import { GOOGLE_CLIENT_ID } from "../../lib/config";
import { useAuth } from "./useAuth";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type OneTapGoogle = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};

function getGoogle(): OneTapGoogle | undefined {
  return (window as unknown as { google?: OneTapGoogle }).google;
}

export default function GoogleOneTap() {
  const { user, loading, setUser } = useAuth();

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (loading || user || !clientId) return;

    let cancelled = false;

    async function onCredential(response: { credential?: string }) {
      if (!response.credential) return;

      try {
        const result = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await result.json().catch(() => ({}));

        if (!result.ok || typeof data.user?.id !== "string") return;

        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      } catch {
        // Silencieux : le bouton de connexion reste disponible.
      }
    }

    function start() {
      const google = getGoogle();
      if (cancelled || !google) return;

      google.accounts.id.initialize({
        client_id: clientId as string,
        callback: onCredential,
        cancel_on_tap_outside: false,
      });

      google.accounts.id.prompt();
    }

    let script: HTMLScriptElement | null = null;

    if (getGoogle()) {
      start();
    } else {
      script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`
      );

      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener("load", start);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", start);
      getGoogle()?.accounts.id.cancel();
    };
  }, [loading, user, setUser]);

  return null;
}
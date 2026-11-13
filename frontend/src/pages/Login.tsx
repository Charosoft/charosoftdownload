
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Download, Mail, Lock, ArrowRight } from "lucide-react";

import { API_URL } from "../lib/api";
import { useAuth } from "../features/auth/useAuth";
import SocialLogin from "../features/auth/SocialLogin";
import type { AuthUser } from "../features/auth/types";

export default function Login() {
  const { user: currentUser, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Connexion impossible.");
      }

      if (!result.user || typeof result.user.id !== "string") {
        throw new Error("Réponse de connexion invalide.");
      }

      const user: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      };

      // La session est dans le cookie sécurisé : on met à jour l'affichage.
      setUser(user);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  // Déjà connecté : retour à l'accueil.
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-card border border-line bg-surface-2 p-6 shadow-2xl sm:p-8">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Download size={23} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            CHAROSOFT <span className="text-brand">DOWNLOAD</span>
          </span>
        </Link>

        <div className="mb-7 text-center">
          <img src="/logo.png" alt="Charosoft" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-3xl font-bold text-white">Bon retour !</h1>
          <p className="mt-2 text-sm text-muted">
            Connecte-toi à ton espace personnel.
          </p>
        </div>

        <SocialLogin
          onError={(text) => {
            setIsError(true);
            setMessage(text);
          }}
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-[#c9cdd3]">
              Adresse e-mail
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-black/30 px-4 focus-within:border-brand">
              <Mail size={18} className="text-[#747b85]" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-[#666d77]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-[#c9cdd3]">
              Mot de passe
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-black/30 px-4 focus-within:border-brand">
              <Lock size={18} className="text-[#747b85]" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ton mot de passe"
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-[#666d77]"
              />
            </div>
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${isError ? "text-red-400" : "text-green-400"}`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-light">
            Créer un compte
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-[#666d77]">
          Télécharge. Simplement.
        </p>
      </section>
    </main>
  );
}

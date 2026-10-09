
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Mail, Lock, ArrowRight } from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export default function Login() {
  const navigate = useNavigate();
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

      if (
        typeof result.token !== "string" ||
        !result.user ||
        typeof result.user.id !== "string"
      ) {
        throw new Error("Réponse de connexion invalide.");
      }

      const user: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      };

      sessionStorage.setItem("charosoft_user", JSON.stringify(user));

      setIsError(false);
      setMessage("Connexion réussie. Ouverture de ton espace…");

      window.setTimeout(() => {
        navigate(user.role === "admin" ? "/admin" : "/");
      }, 700);
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

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101114] p-6 shadow-2xl sm:p-8">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Download size={23} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            CHAROSOFT <span className="text-orange-500">DOWNLOAD</span>
          </span>
        </Link>

        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-white">Bon retour !</h1>
          <p className="mt-2 text-sm text-gray-400">
            Connecte-toi à ton espace personnel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
              Adresse e-mail
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 focus-within:border-orange-500">
              <Mail size={18} className="text-gray-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-gray-300">
              Mot de passe
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 focus-within:border-orange-500">
              <Lock size={18} className="text-gray-500" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ton mot de passe"
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-gray-600"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-400">
            Créer un compte
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-gray-600">
          Télécharge. Simplement.
        </p>
      </section>
    </main>
  );
}


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, User, Mail, Lock, ArrowRight } from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setIsError(true);
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setIsError(true);
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Impossible de créer le compte.");
      }

      setIsError(false);
      setMessage("Compte créé avec succès. Redirection vers la connexion…");
      form.reset();

      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Erreur de connexion au serveur."
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
          <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
          <p className="mt-2 text-sm text-gray-400">
            Prépare ton espace personnel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-gray-300">
              Nom complet
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 focus-within:border-orange-500">
              <User size={18} className="text-gray-500" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Ton nom complet"
                maxLength={100}
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

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
                maxLength={255}
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
                autoComplete="new-password"
                placeholder="Au moins 8 caractères"
                minLength={8}
                required
                className="w-full bg-transparent py-3 text-white outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm text-gray-300">
              Confirmer le mot de passe
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 focus-within:border-orange-500">
              <Lock size={18} className="text-gray-500" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Répète ton mot de passe"
                minLength={8}
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
            {loading ? "Création en cours…" : "Créer mon compte"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Tu as déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-400">
            Se connecter
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-gray-600">
          Télécharge. Simplement.
        </p>
      </section>
    </main>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { API_URL } from "../lib/api";
import { useAuth } from "../features/auth/useAuth";
import "./space.css";

type Item = {
  id: string;
  media_url: string;
  media_title: string | null;
  platform: string | null;
  format: string | null;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default function Account() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/account/history`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError("Impossible de charger l'historique.");
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function clearAll() {
    if (!window.confirm("Vider tout ton historique ?")) return;

    await fetch(`${API_URL}/api/account/history/clear`, {
      method: "POST",
      credentials: "include",
    });
    await load();
  }

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isPremium = user.plan === "premium";
  const planText = isPremium
    ? user.premiumUntil
      ? `Premium jusqu'au ${new Date(user.premiumUntil).toLocaleDateString("fr-FR")}`
      : "Premium illimité"
    : "Compte gratuit";

  return (
    <main className="space">
      <h1>Mon espace</h1>

      <section className="space-card">
        <div>
          <strong>{user.name}</strong>
          <div className="space-muted">{user.email}</div>
        </div>
        <span className={isPremium ? "badge premium" : "badge"}>{planText}</span>
      </section>

      {!isPremium && (
        <p className="space-muted">
          Compte gratuit : fichiers jusqu'à 900 Mo, avec pub. Le Premium enlève
          la limite et la pub.
        </p>
      )}

      <section className="space-card column">
        <div className="space-row">
          <h2>Historique ({total})</h2>
          {items.length > 0 && (
            <button type="button" className="sbtn danger" onClick={clearAll}>
              Vider
            </button>
          )}
        </div>

        {error && <p className="space-error">{error}</p>}
        {!error && items.length === 0 && (
          <p className="space-muted">Aucun téléchargement pour l'instant.</p>
        )}

        <ul className="history">
          {items.map((item) => (
            <li key={item.id}>
              <div className="history-title">
                <a href={item.media_url} target="_blank" rel="noopener noreferrer">
                  {item.media_title || item.media_url}
                </a>
              </div>
              <div className="space-muted">
                {item.platform ?? "—"} · {item.format?.toUpperCase() ?? "—"} ·{" "}
                {formatDate(item.created_at)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
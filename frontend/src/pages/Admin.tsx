import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { API_URL } from "../lib/api";
import { useAuth } from "../features/auth/useAuth";
import "./space.css";

type Stats = { users: number; premium: number; downloads: number; downloads_today: number };

type Row = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
};

async function post(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Action impossible.");
  }
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ search, page: String(page) });

      const [s, u] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/users?${query}`, { credentials: "include" }),
      ]);

      if (!s.ok || !u.ok) throw new Error("Accès refusé ou serveur indisponible.");

      setStats(await s.json());
      const data = await u.json();
      setRows(data.users);
      setTotal(data.total);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }, [search, page]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function act(path: string, body: unknown) {
    try {
      await post(path, body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <main className="space wide">
      <h1>Administration</h1>

      {stats && (
        <div className="stats">
          <div className="space-card column"><span className="space-muted">Utilisateurs</span><strong>{stats.users}</strong></div>
          <div className="space-card column"><span className="space-muted">Premium actifs</span><strong>{stats.premium}</strong></div>
          <div className="space-card column"><span className="space-muted">Téléchargements</span><strong>{stats.downloads}</strong></div>
          <div className="space-card column"><span className="space-muted">Dernières 24 h</span><strong>{stats.downloads_today}</strong></div>
        </div>
      )}

      <input
        className="space-input"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Chercher par nom ou email..."
      />

      {error && <p className="space-error">{error}</p>}

      <div className="table-wrap">
        <table className="space-table">
          <thead>
            <tr><th>Utilisateur</th><th>Plan</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.is_active ? "" : "off"}>
                <td>
                  <strong>{row.name}</strong>
                  {row.role === "admin" && <span className="badge"> admin</span>}
                  <div className="space-muted">{row.email}</div>
                </td>
                <td>
                  {row.is_premium
                    ? row.premium_until
                      ? `Premium → ${new Date(row.premium_until).toLocaleDateString("fr-FR")}`
                      : "Premium illimité"
                    : "Gratuit"}
                  {!row.is_active && <div className="space-error">Suspendu</div>}
                </td>
                <td className="actions">
                  <button className="sbtn" onClick={() => act(`/api/admin/users/${row.id}/premium`, { days: 30 })}>+30 j</button>
                  <button className="sbtn" onClick={() => act(`/api/admin/users/${row.id}/premium`, { days: 365 })}>+1 an</button>
                  <button className="sbtn" onClick={() => act(`/api/admin/users/${row.id}/premium`, { days: null })}>Illimité</button>
                  {row.is_premium && (
                    <button className="sbtn danger" onClick={() => act(`/api/admin/users/${row.id}/premium`, { days: 0 })}>Retirer</button>
                  )}
                  <button
                    className="sbtn danger"
                    onClick={() => act(`/api/admin/users/${row.id}/active`, { active: !row.is_active })}
                  >
                    {row.is_active ? "Suspendre" : "Réactiver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-row">
        <button className="sbtn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Précédent</button>
        <span className="space-muted">Page {page} / {pages}</span>
        <button className="sbtn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivant →</button>
      </div>
    </main>
  );
}
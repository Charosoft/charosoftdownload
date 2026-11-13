import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../features/auth/useAuth";
import "./layout.css";

/**
 * Header unique de CHAROSOFT DOWNLOAD (toutes les pages).
 * Design : copie fidèle du header de l'index.html de référence.
 * Le style est dans ./layout.css (classes "site-*").
 */
export default function Header() {
  // Menu mobile (≤ 760px) ouvert ou fermé
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    closeMenu();
    await logout();
  }

  // La page courante est mise en blanc
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "active" : undefined;


  return (
    <header className="site-header">
      <div className="site-container site-nav">
        <Link className="site-brand" to="/" onClick={closeMenu}>
          <img src="/logo.png" alt="Charosoft" style={{ height: 36, width: "auto" }} />
          <div className="site-brand-name">
            CHAROSOFT <span>DOWNLOAD</span>
          </div>
        </Link>

        <nav
          className={menuOpen ? "site-links open" : "site-links"}
          id="navLinks"
          aria-label="Navigation principale"
        >
          <NavLink to="/" end className={linkClass} onClick={closeMenu}>
            Accueil
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={linkClass}
            onClick={closeMenu}
          >
            Comment ça marche
          </NavLink>
          <NavLink to="/about" className={linkClass} onClick={closeMenu}>
            À propos
          </NavLink>

          {/* Rien tant que la session n'est pas vérifiée (évite le clignotement) */}
          {!loading &&
            (user ? (
              <>
                <NavLink to="/account" className={linkClass} onClick={closeMenu}>
                  Mon espace
                </NavLink>
                {user.role === "admin" && (
                  <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
                    Admin
                  </NavLink>
                )}
                <button
                  type="button"
                  className="site-login"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link className="site-login" to="/login" onClick={closeMenu}>
                Connexion
              </Link>
            ))}
        </nav>

        <button
          className="site-menu"
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="navLinks"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}

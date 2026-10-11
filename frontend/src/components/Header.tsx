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

  const firstName = user?.name.split(" ")[0];

  return (
    <header className="site-header">
      <div className="site-container site-nav">
        <Link className="site-brand" to="/" onClick={closeMenu}>
          <div className="site-brand-mark">C</div>
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
                <span className="site-user" title={user.email}>
                  {firstName}
                </span>
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

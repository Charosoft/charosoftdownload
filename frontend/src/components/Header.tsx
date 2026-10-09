import {
  Download,
  Menu,
  X,
} from "lucide-react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  useState,
} from "react";

/**
 * Header commun de CHAROSOFT DOWNLOAD.
 *
 * Il est utilisé sur toutes les pages publiques.
 *
 * Fonctionnalités :
 * - Logo / identité du produit
 * - Navigation desktop
 * - Menu mobile
 * - Lien vers l'accueil
 * - Lien vers les pages publiques
 */
export default function Header() {
  /**
   * État permettant d'ouvrir ou fermer
   * le menu de navigation sur mobile.
   */
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /**
   * Ferme le menu mobile après avoir
   * sélectionné une page.
   */
  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  /**
   * Style commun aux liens de navigation.
   *
   * NavLink permet de détecter automatiquement
   * la page actuellement sélectionnée.
   */
  function navLinkClass({
    isActive,
  }: {
    isActive: boolean;
  }) {
    return [
      "transition-colors",
      "duration-200",
      "text-sm",
      "font-medium",
      isActive
        ? "text-[#ff7a00]"
        : "text-[#a7adb7] hover:text-white",
    ].join(" ");
  }

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-[#252a31]
        bg-[#08090b]/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[68px]
          max-w-7xl
          items-center
          justify-between
          px-5
          md:h-[76px]
          md:px-6
        "
      >

        {/* ================================
            LOGO
            ================================ */}

        <Link
          to="/"
          onClick={closeMobileMenu}
          className="
            flex
            items-center
            gap-3
          "
        >
          {/* Symbole C */}
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-[#ff9a3d]
              to-[#ff7a00]
              text-lg
              font-black
              text-black
              shadow-[0_8px_25px_rgba(255,122,0,.18)]
            "
          >
            C
          </div>

          {/* Nom du produit */}
          <div className="leading-none">
            <div className="text-sm font-black tracking-[0.12em] text-white md:text-base">
              CHAROSOFT
            </div>

            <div className="mt-1 text-[9px] font-semibold tracking-[0.28em] text-[#ff7a00] md:text-[10px]">
              DOWNLOAD
            </div>
          </div>
        </Link>

        {/* ================================
            NAVIGATION DESKTOP
            ================================ */}

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink
            to="/"
            className={navLinkClass}
          >
            Accueil
          </NavLink>

          <NavLink
            to="/how-it-works"
            className={navLinkClass}
          >
            Comment ça marche
          </NavLink>

          <NavLink
            to="/about"
            className={navLinkClass}
          >
            À propos
          </NavLink>

          {/* Connexion sera activée
              lorsque le système de comptes
              sera développé. */}
          <Link
            to="/login"
            className="
              rounded-xl
              border
              border-[#252a31]
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:border-[#ff7a00]
              hover:text-[#ff7a00]
            "
          >
            Connexion
          </Link>
        </nav>

        {/* ================================
            BOUTON MENU MOBILE
            ================================ */}

        <button
          type="button"
          aria-label={
            mobileMenuOpen
              ? "Fermer le menu"
              : "Ouvrir le menu"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-[#252a31]
            text-white
            transition
            hover:border-[#ff7a00]
            hover:text-[#ff7a00]
            md:hidden
          "
        >
          {mobileMenuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>

      {/* ================================
          MENU MOBILE
          ================================ */}

      {mobileMenuOpen && (
        <div
          className="
            border-t
            border-[#252a31]
            bg-[#101216]
            md:hidden
          "
        >
          <nav className="mx-auto max-w-7xl px-5 py-4">

            <NavLink
              to="/"
              onClick={closeMobileMenu}
              className={({
                isActive,
              }) =>
                [
                  "flex",
                  "items-center",
                  "rounded-xl",
                  "px-4",
                  "py-3",
                  "text-sm",
                  "font-medium",
                  isActive
                    ? "bg-[#ff7a00]/10 text-[#ff7a00]"
                    : "text-[#a7adb7]",
                ].join(" ")
              }
            >
              Accueil
            </NavLink>

            <NavLink
              to="/how-it-works"
              onClick={closeMobileMenu}
              className={({
                isActive,
              }) =>
                [
                  "flex",
                  "items-center",
                  "rounded-xl",
                  "px-4",
                  "py-3",
                  "text-sm",
                  "font-medium",
                  isActive
                    ? "bg-[#ff7a00]/10 text-[#ff7a00]"
                    : "text-[#a7adb7]",
                ].join(" ")
              }
            >
              Comment ça marche
            </NavLink>

            <NavLink
              to="/about"
              onClick={closeMobileMenu}
              className={({
                isActive,
              }) =>
                [
                  "flex",
                  "items-center",
                  "rounded-xl",
                  "px-4",
                  "py-3",
                  "text-sm",
                  "font-medium",
                  isActive
                    ? "bg-[#ff7a00]/10 text-[#ff7a00]"
                    : "text-[#a7adb7]",
                ].join(" ")
              }
            >
              À propos
            </NavLink>

            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="
                mt-2
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-[#252a31]
                px-4
                py-3
                text-sm
                font-semibold
                text-white
              "
            >
              <Download size={17} />

              Connexion
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
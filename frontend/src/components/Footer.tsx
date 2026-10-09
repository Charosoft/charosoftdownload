import {
  Link,
} from "react-router-dom";

/**
 * Footer commun de CHAROSOFT DOWNLOAD.
 *
 * Il est utilisé sur toutes les pages publiques.
 */
export default function Footer() {
  return (
    <footer
      className="
        border-t
        border-[#252a31]
        bg-[#08090b]
      "
    >
      <div
        className="
          mx-auto
          grid
          max-w-7xl
          gap-10
          px-6
          py-12
          md:grid-cols-[1.5fr_1fr_1fr]
        "
      >

        {/* ================================
            IDENTITÉ
            ================================ */}

        <div>
          <Link
            to="/"
            className="
              inline-flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-[#ff7a00]
                font-black
                text-black
              "
            >
              C
            </div>

            <div>
              <div className="text-sm font-black tracking-[0.12em] text-white">
                CHAROSOFT
              </div>

              <div className="mt-1 text-[9px] font-semibold tracking-[0.28em] text-[#ff7a00]">
                DOWNLOAD
              </div>
            </div>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-6 text-[#a7adb7]">
            Télécharge. Simplement.
          </p>

          <p className="mt-2 text-xs text-[#686f79]">
            Produit par Charosoft.
          </p>
        </div>

        {/* ================================
            PRODUIT
            ================================ */}

        <div>
          <h3 className="text-sm font-semibold text-white">
            Produit
          </h3>

          <div className="mt-4 flex flex-col gap-3">

            <Link
              to="/"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              Accueil
            </Link>

            <Link
              to="/how-it-works"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              Comment ça marche
            </Link>

            <Link
              to="/about"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              À propos
            </Link>

          </div>
        </div>

        {/* ================================
            INFORMATIONS
            ================================ */}

        <div>
          <h3 className="text-sm font-semibold text-white">
            Informations
          </h3>

          <div className="mt-4 flex flex-col gap-3">

            <Link
              to="/privacy"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              Confidentialité
            </Link>

            <Link
              to="/terms"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              Conditions
            </Link>

            <Link
              to="/contact"
              className="
                text-sm
                text-[#a7adb7]
                transition
                hover:text-[#ff7a00]
              "
            >
              Contact
            </Link>

          </div>
        </div>
      </div>

      {/* ================================
          COPYRIGHT
          ================================ */}

      <div
        className="
          border-t
          border-[#252a31]
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-2
            px-6
            py-5
            text-xs
            text-[#686f79]
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <span>
            © {new Date().getFullYear()} Charosoft.
            Tous droits réservés.
          </span>

          <span>
            Vers l’horizon numérique.
          </span>
        </div>
      </div>
    </footer>
  );
}
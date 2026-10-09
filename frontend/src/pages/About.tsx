import {
  ArrowRight,
  Code2,
  Download,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * Page "À propos".
 *
 * Présente CHAROSOFT DOWNLOAD comme un produit
 * développé dans l'écosystème Charosoft.
 */
export default function About() {
  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      {/* ================================
          HERO
          ================================ */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-[#ff7a00]">
          CHAROSOFT · PRODUIT NUMÉRIQUE
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          À propos de{" "}
          <span className="text-[#ff7a00]">
            CHAROSOFT DOWNLOAD
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#a7adb7] md:text-lg">
          Un outil pensé pour rendre le traitement des
          liens média plus simple, plus clair et plus
          accessible.
        </p>
      </section>

      {/* ================================
          PRÉSENTATION
          ================================ */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#ff7a00]">
              NOTRE APPROCHE
            </p>

            <h2 className="text-3xl font-bold md:text-4xl">
              La technologie doit rester simple.
            </h2>

            <p className="mt-6 leading-8 text-[#a7adb7]">
              CHAROSOFT DOWNLOAD est un produit de
              l'écosystème Charosoft, conçu autour d'une
              idée simple : proposer une expérience
              technique sans rendre son utilisation
              compliquée.
            </p>

            <p className="mt-5 leading-8 text-[#a7adb7]">
              L'interface privilégie la rapidité,
              la lisibilité et une utilisation directe.
              L'objectif est de permettre à l'utilisateur
              de coller un lien, analyser les possibilités
              disponibles et choisir son format en quelques
              étapes.
            </p>
          </div>
        </div>
      </section>

      {/* ================================
          VALEURS
          ================================ */}
      <section className="border-y border-[#252a31] bg-[#101216]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">

          <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7">
            <Zap
              size={28}
              className="mb-5 text-[#ff7a00]"
            />

            <h3 className="text-xl font-semibold">
              Rapidité
            </h3>

            <p className="mt-3 leading-7 text-[#a7adb7]">
              Une expérience conçue pour réduire les
              étapes inutiles et aller rapidement vers
              le résultat.
            </p>
          </article>

          <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7">
            <Code2
              size={28}
              className="mb-5 text-[#ff7a00]"
            />

            <h3 className="text-xl font-semibold">
              Technologie
            </h3>

            <p className="mt-3 leading-7 text-[#a7adb7]">
              Une architecture moderne permettant
              d'améliorer progressivement le service
              et ses fonctionnalités.
            </p>
          </article>

          <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7">
            <ShieldCheck
              size={28}
              className="mb-5 text-[#ff7a00]"
            />

            <h3 className="text-xl font-semibold">
              Responsabilité
            </h3>

            <p className="mt-3 leading-7 text-[#a7adb7]">
              Le service est conçu pour être utilisé
              dans le respect des droits applicables
              aux contenus traités.
            </p>
          </article>
        </div>
      </section>

      {/* ================================
          CHAROSOFT
          ================================ */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff7a00]">
          <Download
            size={30}
            className="text-black"
          />
        </div>

        <h2 className="text-3xl font-bold md:text-4xl">
          Une vision tournée vers le numérique.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#a7adb7]">
          CHAROSOFT développe des solutions et des
          services numériques avec une approche orientée
          pratique, innovation et simplicité.
        </p>

        <p className="mt-6 text-sm font-medium text-[#ff7a00]">
          Vers l’horizon numérique.
        </p>
      </section>

      {/* ================================
          CTA
          ================================ */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#ff7a00] px-6 py-3 font-semibold text-black transition hover:bg-[#ff9a3d]"
        >
          Utiliser CHAROSOFT DOWNLOAD
          <ArrowRight size={18} />
        </a>
      </section>
    </main>
  );
}
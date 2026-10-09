import {
  ArrowDownToLine,
  CheckCircle2,
  Link2,
  Search,
  Zap,
} from "lucide-react";

/**
 * Page "Comment ça marche ?"
 *
 * Cette page explique simplement le fonctionnement
 * de CHAROSOFT DOWNLOAD en trois étapes.
 */
export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* ================================
          HERO DE LA PAGE
          ================================ */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-[#ff7a00]">
          SIMPLE · RAPIDE · TECHNIQUE
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Comment ça{" "}
          <span className="text-[#ff7a00]">
            marche ?
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#a7adb7] md:text-lg">
          CHAROSOFT DOWNLOAD permet d'analyser un
          lien média compatible, puis de sélectionner
          le format disponible qui vous convient.
        </p>
      </section>

      {/* ================================
          LES 3 ÉTAPES
          ================================ */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {/* Étape 01 */}
        <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00]">
            <Link2 size={24} />
          </div>

          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#ff7a00]">
            01
          </p>

          <h2 className="text-2xl font-semibold">
            Collez le lien
          </h2>

          <p className="mt-4 leading-7 text-[#a7adb7]">
            Copiez l'URL du média que vous souhaitez
            traiter et collez-la dans la zone prévue
            sur la page d'accueil.
          </p>
        </article>

        {/* Étape 02 */}
        <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00]">
            <Search size={24} />
          </div>

          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#ff7a00]">
            02
          </p>

          <h2 className="text-2xl font-semibold">
            Analysez
          </h2>

          <p className="mt-4 leading-7 text-[#a7adb7]">
            Le service analyse le lien afin d'identifier
            les informations disponibles et les formats
            compatibles avec la source.
          </p>
        </article>

        {/* Étape 03 */}
        <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-7 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00]">
            <ArrowDownToLine size={24} />
          </div>

          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#ff7a00]">
            03
          </p>

          <h2 className="text-2xl font-semibold">
            Téléchargez
          </h2>

          <p className="mt-4 leading-7 text-[#a7adb7]">
            Choisissez l'un des formats disponibles,
            puis lancez le téléchargement du fichier.
          </p>
        </article>
      </section>

      {/* ================================
          AVANTAGES
          ================================ */}
      <section className="border-y border-[#252a31] bg-[#101216]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Zap className="mb-4 text-[#ff7a00]" size={28} />

              <h3 className="text-xl font-semibold">
                Rapide
              </h3>

              <p className="mt-3 leading-7 text-[#a7adb7]">
                Une interface pensée pour aller
                directement à l'essentiel.
              </p>
            </div>

            <div>
              <CheckCircle2
                className="mb-4 text-[#ff7a00]"
                size={28}
              />

              <h3 className="text-xl font-semibold">
                Simple
              </h3>

              <p className="mt-3 leading-7 text-[#a7adb7]">
                Pas besoin de parcourir plusieurs écrans
                avant d'arriver au téléchargement.
              </p>
            </div>

            <div>
              <Search
                className="mb-4 text-[#ff7a00]"
                size={28}
              />

              <h3 className="text-xl font-semibold">
                Maîtrisé
              </h3>

              <p className="mt-3 leading-7 text-[#a7adb7]">
                Les formats disponibles sont présentés
                clairement avant le téléchargement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================
          NOTE D'UTILISATION
          ================================ */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">
          Utilisez le service de manière responsable
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#a7adb7]">
          Vous devez disposer des droits ou des
          autorisations nécessaires pour télécharger
          et utiliser les contenus concernés.
        </p>
      </section>
    </main>
  );
}
/**
 * Page de politique de confidentialité.
 *
 * Cette première version présente les principes
 * généraux de traitement des données du service.
 */
export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-14 pt-24">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#ff7a00]">
          CHAROSOFT DOWNLOAD
        </p>

        <h1 className="text-4xl font-bold md:text-5xl">
          Politique de confidentialité
        </h1>

        <p className="mt-5 text-[#a7adb7]">
          Votre confidentialité est prise en compte dans
          la conception du service.
        </p>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-10 rounded-[18px] border border-[#252a31] bg-[#15181d] p-7 md:p-10">

          <article>
            <h2 className="text-2xl font-semibold">
              1. Informations générales
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              CHAROSOFT DOWNLOAD est un service permettant
              d'analyser des liens média compatibles et de
              générer des fichiers dans les formats proposés
              par le service.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              2. Données techniques
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Certaines informations techniques peuvent être
              traitées afin d'assurer le fonctionnement,
              la sécurité, la maintenance et l'amélioration
              du service.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              3. Liens soumis au service
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Les liens transmis au service peuvent être
              temporairement traités par l'infrastructure
              nécessaire à l'analyse et au téléchargement.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              4. Conservation
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Les fichiers temporaires générés pendant le
              traitement sont destinés à être supprimés
              après leur utilisation conformément au
              fonctionnement technique du service.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              5. Sécurité
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Des mesures techniques sont mises en place
              pour protéger l'infrastructure et limiter
              les utilisations abusives du service.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              6. Évolution de la politique
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Cette politique pourra évoluer lorsque de
              nouvelles fonctionnalités ou de nouveaux
              traitements de données seront introduits.
            </p>
          </article>

        </div>
      </section>
    </main>
  );
}
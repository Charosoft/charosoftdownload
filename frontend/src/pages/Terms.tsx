/**
 * Page des conditions d'utilisation.
 *
 * Elle présente les règles générales applicables
 * à l'utilisation de CHAROSOFT DOWNLOAD.
 */
export default function Terms() {
  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-14 pt-24">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#ff7a00]">
          CHAROSOFT DOWNLOAD
        </p>

        <h1 className="text-4xl font-bold md:text-5xl">
          Conditions d'utilisation
        </h1>

        <p className="mt-5 text-[#a7adb7]">
          Les règles essentielles à connaître avant
          d'utiliser le service.
        </p>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-10 rounded-[18px] border border-[#252a31] bg-[#15181d] p-7 md:p-10">

          <article>
            <h2 className="text-2xl font-semibold">
              1. Utilisation du service
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              CHAROSOFT DOWNLOAD doit être utilisé dans
              le respect des lois et réglementations
              applicables dans votre juridiction.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              2. Droits sur les contenus
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              L'utilisateur est responsable des contenus
              qu'il choisit de traiter et doit disposer
              des droits, autorisations ou permissions
              nécessaires à leur téléchargement et à
              leur utilisation.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              3. Contenus protégés
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Le service n'a pas pour objectif de permettre
              le contournement de protections techniques,
              de DRM ou de restrictions d'accès.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              4. Utilisation abusive
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              Toute utilisation visant à perturber,
              surcharger ou compromettre le service peut
              entraîner des restrictions d'accès.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              5. Disponibilité
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              La disponibilité des formats et des sources
              dépend notamment des plateformes concernées
              et de leurs changements techniques.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold">
              6. Évolution du service
            </h2>

            <p className="mt-4 leading-8 text-[#a7adb7]">
              CHAROSOFT peut faire évoluer, modifier ou
              interrompre certaines fonctionnalités du
              service afin d'assurer son fonctionnement
              et son amélioration.
            </p>
          </article>

        </div>
      </section>
    </main>
  );
}
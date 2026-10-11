
import {
  ArrowDownToLine,
  CheckCircle2,
  Link2,
  Search,
  Zap,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Collez le lien",
    description:
      "Copiez l’URL du média que vous souhaitez traiter et collez-la dans la zone prévue sur la page d’accueil.",
    icon: Link2,
  },
  {
    number: "02",
    title: "Analysez",
    description:
      "Le service analyse le lien afin d’identifier les informations disponibles et les formats compatibles avec la source.",
    icon: Search,
  },
  {
    number: "03",
    title: "Téléchargez",
    description:
      "Choisissez l’un des formats disponibles, puis lancez le téléchargement du fichier.",
    icon: ArrowDownToLine,
  },
];

const benefits = [
  {
    title: "Rapide",
    description:
      "Une interface pensée pour aller directement à l’essentiel.",
    icon: Zap,
  },
  {
    title: "Simple",
    description:
      "Pas besoin de parcourir plusieurs écrans avant d’arriver au téléchargement.",
    icon: CheckCircle2,
  },
  {
    title: "Maîtrisé",
    description:
      "Les formats disponibles sont présentés clairement avant le téléchargement.",
    icon: Search,
  },
];

export default function HowItWorks() {
  return (
    <main className="relative isolate overflow-hidden bg-surface text-white">
      {/* Décoration discrète */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[min(90%,800px)] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-[110px]"
      />

      {/* Présentation */}
      <section className="mx-auto max-w-7xl px-5 pb-14 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.07] px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-light sm:text-sm">
            Simple · Rapide · Efficace
          </p>
        </div>

        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl">
          Comment ça marche
          <span className="mt-1 block text-brand">?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          CHAROSOFT DOWNLOAD vous permet d’analyser un lien média compatible,
          puis de sélectionner le format disponible qui vous convient.
        </p>
      </section>

      {/* Étapes */}
      <section
        aria-label="Les trois étapes du téléchargement"
        className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-line" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777f8a]">
            Les étapes
          </p>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-6">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article
              key={number}
              className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-[#111318] p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-card sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand transition group-hover:bg-brand/15">
                  <Icon size={23} strokeWidth={1.8} />
                </div>

                <span className="text-3xl font-bold tracking-tight text-[#343941] transition group-hover:text-brand/70">
                  {number}
                </span>
              </div>

              <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h2>

              <p className="mt-3 flex-1 text-sm leading-7 text-muted sm:text-base">
                {description}
              </p>

              <div className="mt-7 h-1 w-10 rounded-full bg-brand/60 transition-all duration-300 group-hover:w-16 group-hover:bg-brand" />
            </article>
          ))}
        </div>
      </section>

      {/* Avantages */}
      <section className="border-y border-line bg-surface-2">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              L’essentiel
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Une expérience pensée pour vous
            </h2>

            <p className="mt-4 leading-7 text-muted">
              Tout est organisé pour rendre les étapes plus claires et
              faciliter l’utilisation du service.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
            {benefits.map(({ title, description, icon: Icon }) => (
              <article key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-brand">
                  <Icon size={21} strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Utilisation responsable */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl rounded-card border border-line bg-[#111318] px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand">
            <CheckCircle2 size={22} />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Utilisez le service de manière responsable
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Vous devez disposer des droits ou des autorisations nécessaires
            pour télécharger et utiliser les contenus concernés.
          </p>
        </div>
      </section>
    </main>
  );
}

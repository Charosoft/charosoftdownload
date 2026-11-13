import { Mail, Flag } from "lucide-react";

// À changer ici une seule fois (adresse réelle du support).
const SUPPORT_EMAIL = "charosoft6@gmail.com";

export default function Contact() {
  return (
    <main className="min-h-screen bg-surface text-white">
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-24 text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-brand">
          CHAROSOFT DOWNLOAD
        </p>
        <h1 className="text-4xl font-bold md:text-5xl">Nous contacter</h1>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">
          Une question, un problème technique ou une demande concernant le
          service ? Écris-nous, nous répondons selon les disponibilités.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-2">
        <article className="flex flex-col rounded-card border border-line bg-card p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
            <Mail size={24} className="text-brand" />
          </div>
          <h2 className="text-2xl font-semibold">Support</h2>
          <p className="mt-4 flex-1 leading-7 text-muted">
            Pour les questions générales, les problèmes de téléchargement ou
            de compte.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Charosoft%20Download`}
            className="mt-6 break-all font-medium text-brand hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </article>

        <article className="flex flex-col rounded-card border border-line bg-card p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
            <Flag size={24} className="text-brand" />
          </div>
          <h2 className="text-2xl font-semibold">Signalement</h2>
          <p className="mt-4 flex-1 leading-7 text-muted">
            Pour signaler un abus ou demander le retrait d'un contenu, écris-nous
            en indiquant le lien concerné et la raison de ta demande.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Signalement%20-%20Charosoft%20Download`}
            className="mt-6 break-all font-medium text-brand hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </article>
      </section>
    </main>
  );
}
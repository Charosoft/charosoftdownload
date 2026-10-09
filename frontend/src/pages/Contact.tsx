import {
  Mail,
  MessageSquare,
} from "lucide-react";

/**
 * Page Contact.
 *
 * Cette version prépare l'espace de contact public.
 * L'adresse définitive pourra être remplacée lorsque
 * le domaine et la messagerie professionnelle seront
 * configurés.
 */
export default function Contact() {
  return (
    <main className="min-h-screen bg-[#08090b] text-white">

      {/* ================================
          HERO
          ================================ */}
      <section className="mx-auto max-w-4xl px-6 pb-14 pt-24 text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#ff7a00]">
          CHAROSOFT DOWNLOAD
        </p>

        <h1 className="text-4xl font-bold md:text-5xl">
          Nous contacter
        </h1>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#a7adb7]">
          Une question, un problème technique ou une
          demande concernant le service ? Contactez
          l'équipe Charosoft.
        </p>
      </section>

      {/* ================================
          CARTES CONTACT
          ================================ */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-2">

        {/* Email */}
        <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7a00]/10">
            <Mail
              size={24}
              className="text-[#ff7a00]"
            />
          </div>

          <h2 className="text-2xl font-semibold">
            Support
          </h2>

          <p className="mt-4 leading-7 text-[#a7adb7]">
            Pour les demandes générales, questions
            techniques ou problèmes liés au service.
          </p>

          {/* Adresse temporaire de présentation.
              À remplacer par l'adresse professionnelle
              définitive avant la mise en production. */}
          <p className="mt-6 font-medium text-[#ff7a00]">
            support@charosoftdownload.com
          </p>
        </article>

        {/* Assistance */}
        <article className="rounded-[18px] border border-[#252a31] bg-[#15181d] p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7a00]/10">
            <MessageSquare
              size={24}
              className="text-[#ff7a00]"
            />
          </div>

          <h2 className="text-2xl font-semibold">
            Assistance
          </h2>

          <p className="mt-4 leading-7 text-[#a7adb7]">
            Lorsque le service sera entièrement déployé,
            cet espace pourra également accueillir les
            demandes d'assistance et de signalement.
          </p>

          <p className="mt-6 text-sm text-[#a7adb7]">
            Réponse selon les disponibilités du support.
          </p>
        </article>
      </section>
    </main>
  );
}
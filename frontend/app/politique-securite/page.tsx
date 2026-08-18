import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Mesures techniques",
    items: [
      "Chiffrement des mots de passe et sessions via Supabase Auth",
      "Row Level Security activée sur toutes les tables",
      "HTTPS obligatoire",
      "Verification de signature sur les webhooks de paiement",
    ],
  },
  {
    title: "Signalement d'une faille",
    items: [
      "Adresse de signalement : ucaomarketplace2026@gmail.com",
      "Informations à transmettre : description de la faille, étapes de reproduction, impact estimé",
      "Délai de réponse indicatif : 30 minutes à 48 heures",
    ],
  },
];

export default function PolitiqueSecuritePage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Sécurité</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Politique de sécurité</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page résume les mesures de sécurité prévues et la procédure de signalement.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="panel p-6">
                <h2 className="mb-4 text-xl font-bold">{section.title}</h2>
                <ul className="space-y-3 text-ucao-muted dark:text-[#a8b8cc]">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

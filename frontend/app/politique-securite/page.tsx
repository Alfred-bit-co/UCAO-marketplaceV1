import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Mesures techniques",
    items: [
      "Chiffrement des mots de passe et sessions via Supabase Auth",
      "Row Level Security activee sur toutes les tables",
      "HTTPS obligatoire",
      "Verification de signature sur les webhooks de paiement",
    ],
  },
  {
    title: "Signalement d'une faille",
    items: [
      "Adresse de signalement : [À COMPLÉTER]",
      "Informations a transmettre : description de la faille, etapes de reproduction, impact estime",
      "Delai de reponse indicatif : [À COMPLÉTER]",
    ],
  },
];

export default function PolitiqueSecuritePage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Securite</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Politique de securite</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page resume les mesures de securite prevues et la procedure de signalement. Les champs marques [À COMPLÉTER] restent a personnaliser.
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

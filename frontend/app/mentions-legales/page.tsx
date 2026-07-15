import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Editeur du site",
    items: ["Nom de l'editeur : [À COMPLÉTER]", "Adresse : [À COMPLÉTER]", "Responsable de publication : [À COMPLÉTER]"],
  },
  {
    title: "Hebergement",
    items: [
      "Frontend : Vercel",
      "Backend : Railway",
      "Donnees et authentification : Supabase",
    ],
  },
  {
    title: "Contact",
    items: ["Email de contact : [À COMPLÉTER]", "Telephone : [À COMPLÉTER]"],
  },
  {
    title: "Droit applicable",
    items: ["Droit applicable : [À COMPLÉTER]", "Juridiction competente : [À COMPLÉTER]"],
  },
];

export default function MentionsLegalesPage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Informations legales</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Mentions legales</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page sert de squelette. Les champs marques [À COMPLÉTER] doivent etre remplaces par les informations officielles.
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

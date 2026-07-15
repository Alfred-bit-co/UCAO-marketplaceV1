import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Donnees collectees",
    items: ["Nom", "Email", "Telephone", "Historique de commandes"],
  },
  {
    title: "Finalites",
    items: ["Gestion de compte", "Transactions", "Amelioration du service"],
  },
  {
    title: "Base legale",
    items: ["Base legale du traitement : [À COMPLÉTER]"],
  },
  {
    title: "Duree de conservation",
    items: ["Duree de conservation des donnees : [À COMPLÉTER]"],
  },
  {
    title: "Droits de l'utilisateur",
    items: ["Acces", "Rectification", "Suppression", "Contact pour exercer les droits : [À COMPLÉTER]"],
  },
  {
    title: "Sous-traitants",
    items: ["Supabase pour l'hebergement des donnees", "FedaPay pour les paiements"],
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Donnees personnelles</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Politique de confidentialite</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page presente les traitements prevus. Les champs marques [À COMPLÉTER] doivent etre adaptes au cadre juridique applicable.
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

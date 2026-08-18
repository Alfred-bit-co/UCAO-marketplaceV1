import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Données collectées",
    items: ["Nom", "Email", "Téléphone", "Historique de commandes"],
  },
  {
    title: "Finalités",
    items: ["Gestion de compte", "Transactions", "Amélioration du service"],
  },
  {
    title: "Base légale",
    items: ["Base légale du traitement : exécution du service, consentement de l'utilisateur et intérêt légitime de sécurisation de la plateforme"],
  },
  {
    title: "Durée de conservation",
    items: ["Durée de conservation des données : pendant la durée du compte, puis selon les obligations légales applicables"],
  },
  {
    title: "Droits de l'utilisateur",
    items: ["Accès", "Rectification", "Suppression", "Contact pour exercer les droits : ucaomarketplace2026@gmail.com"],
  },
  {
    title: "Sous-traitants",
    items: ["Supabase pour l'hébergement des données", "FedaPay pour les paiements"],
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Données personnelles</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Politique de confidentialité</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page présente les traitements prévus pour les comptes, les commandes et la sécurité de UCAO Marketplace.
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

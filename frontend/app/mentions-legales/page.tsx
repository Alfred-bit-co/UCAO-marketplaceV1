import { PageShell } from "@/components/page-shell";

const sections = [
  {
    title: "Éditeur du site",
    items: ["Nom de l'éditeur : AYITOU Alfred", "Adresse : Togo — Lomé", "Responsable de publication : Alfred AYITOU"],
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
    items: ["Email de contact : ucaomarketplace2026@gmail.com", "Téléphone : +228 92 98 29 26"],
  },
  {
    title: "Responsable technique",
    items: ["Email : alfredayitou@gmail.com", "Téléphone : +228 72 23 90 76"],
  },
  {
    title: "Droit applicable",
    items: ["Droit applicable : Droit togolais", "Juridiction compétente : Tribunaux de Lomé, République togolaise"],
  },
];

export default function MentionsLegalesPage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Informations légales</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Mentions légales</h1>
          <p className="mb-10 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Informations relatives à l&apos;éditeur, aux contacts de la plateforme et au cadre juridique applicable.
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

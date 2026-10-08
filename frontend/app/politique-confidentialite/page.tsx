import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — UCAO Marketplace",
  description: "Découvrez les données traitées et vos droits sur UCAO Marketplace.",
};

const LAST_UPDATE = "7 octobre 2026";

const sections = [
  {
    title: "Qui sommes-nous ?",
    items: [
      "UCAO Marketplace est un projet étudiant indépendant, non affilié officiellement à l'administration de l'UCAO-UUT.",
      "La plateforme met en relation des étudiants qui vendent et des étudiants qui achètent. Les achats et les paiements entre étudiants se font en dehors du site.",
      "Contact pour toute question sur vos données : ucaomarketplace2026@gmail.com",
    ],
  },
  {
    title: "Données collectées",
    items: [
      "Votre nom et votre adresse e-mail",
      "Votre numéro de téléphone, votre filière et votre niveau d'études (pour les vendeurs)",
      "Si vous utilisez la connexion Google : le nom et l'adresse e-mail transmis par Google",
      "La photo de votre carte d'étudiant (pour les vendeurs)",
      "Vos produits, vos stands, votre abonnement et vos paiements d'abonnement (montant, palier, statut, identifiant de transaction ; jamais votre numéro de carte ni votre code Mobile Money)",
      "Vos avis sur la plateforme et les produits que vous avez aimés",
      "Des données techniques (adresse IP, navigateur, journaux d'erreurs), conservées par nos prestataires d'hébergement",
    ],
  },
  {
    title: "Carte d'étudiant",
    items: [
      "La photo sert uniquement à vérifier l'appartenance à la communauté universitaire.",
      "Elle est conservée dans un espace privé : seuls vous et l'équipe UCAO Marketplace pouvez la consulter, jamais le public.",
      "Elle est supprimée en même temps que votre compte.",
    ],
  },
  {
    title: "Ce qui est public",
    items: [
      "Le nom et le numéro de téléphone d'un vendeur, affichés avec ses produits pour que les acheteurs puissent le contacter",
      "Les produits et les stands d'un vendeur dont l'abonnement est actif",
      "Le nombre de « j'aime » d'un produit (jamais la liste des personnes qui ont aimé)",
    ],
  },
  {
    title: "Ce qui n'est jamais public",
    items: [
      "Votre adresse e-mail",
      "Votre carte d'étudiant, votre filière et votre niveau d'études",
      "Les produits que vous avez aimés",
      "Vos paiements d'abonnement",
    ],
  },
  {
    title: "Finalités",
    items: [
      "Créer et gérer votre compte",
      "Vérifier que les vendeurs sont de vrais étudiants",
      "Afficher vos produits et votre stand, et gérer votre abonnement et son échéance",
      "Modérer les stands et les avis, et suspendre un compte en cas d'abus",
      "Protéger la plateforme contre la fraude et vous contacter au sujet de votre compte",
    ],
  },
  {
    title: "Base légale",
    items: ["Base légale du traitement : exécution du service, consentement de l'utilisateur et intérêt légitime de sécurisation de la plateforme"],
  },
  {
    title: "Durée de conservation",
    items: [
      "Vos données sont conservées tant que votre compte existe.",
      "Quand un compte est supprimé, son profil, ses produits, ses stands, ses avis, ses « j'aime », ses paiements d'abonnement et ses fichiers (dont la carte d'étudiant) sont supprimés.",
      "Les journaux techniques sont conservés par nos prestataires selon leurs propres durées.",
    ],
  },
  {
    title: "Droits de l'utilisateur",
    items: [
      "Accès à vos données",
      "Rectification",
      "Suppression, y compris celle de votre compte",
      "Opposition et limitation d'un traitement",
      "Pour exercer vos droits : écrivez à ucaomarketplace2026@gmail.com avec l'objet « Exercice de mes droits »",
    ],
  },
  {
    title: "Prestataires",
    items: [
      "Supabase : base de données, authentification et stockage des fichiers",
      "Vercel : hébergement du site",
      "Google : connexion avec un compte Google, si vous la choisissez",
      "FedaPay : paiement des abonnements, lorsque le paiement en ligne est activé",
      "Nous ne vendons pas vos données et nous ne les utilisons pas pour de la publicité.",
    ],
  },
  {
    title: "Cookies et stockage local",
    items: [
      "Nous utilisons uniquement ce qui est nécessaire au fonctionnement du site, comme la session qui vous garde connecté.",
      "Nous n'utilisons pas de cookies publicitaires.",
    ],
  },
  {
    title: "Sécurité",
    items: [
      "Les mots de passe sont stockés sous forme chiffrée : nous ne pouvons pas les lire.",
      "Chaque utilisateur n'accède qu'à ses propres données privées.",
      "Aucun système n'étant totalement sûr, nous ne pouvons pas garantir une sécurité absolue.",
    ],
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <PageShell>
      <main className="bg-ucao-soft py-16 dark:bg-[#071426]">
        <section className="container-ucao">
          <p className="eyebrow">Données personnelles</p>
          <h1 className="mb-5 text-[clamp(32px,5vw,52px)] font-medium leading-tight">Politique de confidentialité</h1>
          <p className="mb-3 max-w-3xl text-ucao-muted dark:text-[#a8b8cc]">
            Cette page explique quelles données UCAO Marketplace collecte, pourquoi, qui peut les voir, combien de temps nous les gardons et comment exercer vos droits.
          </p>
          <p className="mb-10 text-sm text-ucao-muted dark:text-[#a8b8cc]">Dernière mise à jour : {LAST_UPDATE}</p>
          <div className="grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="panel p-6">
                <h2 className="mb-4 text-xl font-medium">{section.title}</h2>
                <ul className="space-y-3 text-ucao-muted dark:text-[#a8b8cc]">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-sm text-ucao-muted dark:text-[#a8b8cc]">
            Une question ou une demande ? Écrivez-nous à{" "}
            <a className="font-medium text-ucao-red underline" href="mailto:ucaomarketplace2026@gmail.com">
              ucaomarketplace2026@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </PageShell>
  );
}
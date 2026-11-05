import { HelpCircle } from "@/lib/icons";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Questions fréquentes — UCAO Marketplace",
  description: "Réponses aux questions les plus posées sur UCAO Marketplace.",
};

const FAQ_GROUPS = [
  {
    title: "Acheter",
    items: [
      {
        question: "Comment acheter un produit ?",
        answer: "Parcours le catalogue, puis clique sur « Contacter » sur la carte du produit (ou sur « Discuter sur WhatsApp » depuis sa fiche) pour joindre directement le vendeur. WhatsApp s'ouvre avec un message déjà écrit.",
      },
      {
        question: "Peut-on payer sur le site ?",
        answer: "Non. Le site te met en relation : tu conviens du prix, de la remise et du paiement directement avec le vendeur.",
      },
      {
        question: "Où se déroulent les échanges (paiement, remise du produit) ?",
        answer: "Toujours en personne, sur le campus de l'UCAO-UUT. La plateforme ne prend pas en charge les litiges liés à un échange effectué en dehors du campus ou à distance. Donnez-vous rendez-vous dans un lieu public, et ne paie jamais à l'avance un inconnu.",
      },
      {
        question: "À quoi sert le cœur sur un produit ?",
        answer: "À dire que tu aimes ce produit. Tu n'as pas besoin de compte : un identifiant anonyme est enregistré dans ton navigateur pour retenir tes « j'aime ». Le nombre de cœurs est visible par tous, mais personne ne voit qui a aimé. Clique à nouveau sur le cœur pour retirer ton « j'aime ». Si tu effaces les données de ton navigateur, tu n'en retrouveras plus la trace. Un vendeur connecté ne peut pas aimer ses propres produits.",
      },
    ],
  },
  {
    title: "Vendre",
    items: [
      {
        question: "Comment devenir vendeur ?",
        answer: "Clique sur « Devenir vendeur », ajoute ton numéro WhatsApp (c'est par là que les acheteurs te contactent), choisis un palier (STANDARD, PREMIUM ou VIP), puis paie l'abonnement via Mobile Money (TMoney, Flooz).",
      },
      {
        question: "Quels sont les abonnements ?",
        answer: "STANDARD : 500 FCFA par mois, 5 produits. PREMIUM : 1 500 FCFA par mois, 10 produits et 1 stand. VIP : 5 000 FCFA par mois, 30 produits et 5 stands. Les produits des vendeurs VIP apparaissent en premier dans le catalogue, puis ceux des vendeurs PREMIUM, puis STANDARD.",
      },
      {
        question: "Le renouvellement est-il automatique ?",
        answer: "Non. Le Mobile Money ne permet pas de prélèvement automatique. Tu dois toi-même relancer le paiement chaque mois depuis ton tableau de bord.",
      },
      {
        question: "Que se passe-t-il si je ne renouvelle pas à temps ?",
        answer: "Tes produits et ton stand sont masqués publiquement jusqu'au renouvellement. Rien n'est supprimé : en renouvelant, tout réapparaît tout de suite. Tu es prévenu 7 jours, 3 jours et 30 minutes avant la fin de ton abonnement.",
      },
      {
        question: "Pourquoi demandez-vous ma carte d'étudiant ?",
        answer: "Pour vérifier que les vendeurs sont de vrais étudiants. Elle est conservée dans un espace privé : seuls toi et l'équipe pouvez la consulter, et elle est supprimée avec ton compte.",
      },
      {
        question: "Mon numéro de téléphone est-il visible ?",
        answer: "Oui : le numéro WhatsApp d'un vendeur est affiché avec ses produits, pour que les acheteurs puissent le contacter. Ton adresse e-mail, elle, n'est jamais publique.",
      },
    ],
  },
  {
    title: "Mon compte",
    items: [
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer: "Va sur la page de connexion et clique sur « Mot de passe oublié ? » pour recevoir un lien de réinitialisation par e-mail. Si tu te connectes avec Google, utilise simplement « Continuer avec Google ».",
      },
      {
        question: "Comment supprimer mon compte et mes données ?",
        answer: "Écris à ucaomarketplace2026@gmail.com avec l'objet « Exercice de mes droits ». Ton profil, tes produits, tes stands, tes avis, tes « j'aime » et tes fichiers (dont ta carte d'étudiant) sont supprimés.",
      },
      {
        question: "Pourquoi mon compte est-il suspendu ?",
        answer: "Un administrateur peut suspendre un compte en cas d'abus. Tu peux toujours te connecter et naviguer, mais tu ne peux plus publier de produit ni de stand. Écris-nous pour comprendre la raison.",
      },
    ],
  },
  {
    title: "Sécurité et signalement",
    items: [
      {
        question: "Comment signaler un produit, un vendeur ou un abus ?",
        answer: "Utilise le lien « Signaler un abus » en bas de chaque page, ou écris à ucaomarketplace2026@gmail.com en indiquant le nom du produit ou du vendeur.",
      },
      {
        question: "Mon avis est-il publié tout de suite ?",
        answer: "Non : l'équipe valide chaque avis avant sa publication.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <PageShell>
      <main>
        <PageHero icon={HelpCircle} eyebrow="Aide" title="Questions fréquentes">
          Les réponses aux questions les plus posées par les étudiants.
        </PageHero>
        <section className="container-ucao max-w-2xl py-[54px] pb-[84px]">
          {FAQ_GROUPS.map((group, index) => (
            <div key={group.title} className={index === 0 ? "" : "mt-10"}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-ucao-muted dark:text-[#9db0c8]">{group.title}</h2>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <details key={item.question} className="panel p-5">
                    <summary className="cursor-pointer font-medium">{item.question}</summary>
                    <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-8 text-center text-sm text-ucao-muted dark:text-[#a8b8cc]">
            Tu ne trouves pas de réponse ?{" "}
            <a className="font-medium text-ucao-red underline" href="mailto:ucaomarketplace2026@gmail.com">
              Contacte-nous
            </a>
            .
          </p>
        </section>
      </main>
    </PageShell>
  );
}
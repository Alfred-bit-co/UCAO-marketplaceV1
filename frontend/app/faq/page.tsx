import { HelpCircle } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";

const FAQ_ITEMS = [
  {
    question: "Comment acheter un produit ?",
    answer: "Parcourez le catalogue, ouvrez la fiche du produit qui vous intéresse, puis cliquez sur \"Discuter sur WhatsApp\" pour contacter directement le vendeur.",
  },
  {
    question: "Comment devenir vendeur ?",
    answer: "Cliquez sur \"Devenir vendeur\", choisissez un palier (STANDARD, PREMIUM ou VIP), puis payez l'abonnement via Mobile Money (TMoney, Flooz).",
  },
  {
    question: "Le renouvellement est-il automatique ?",
    answer: "Non. Le Mobile Money ne permet pas de prélèvement automatique. Vous devez vous-même relancer le paiement chaque mois depuis votre tableau de bord.",
  },
  {
    question: "Que se passe-t-il si je ne renouvelle pas à temps ?",
    answer: "Vos produits et votre stand sont masqués publiquement jusqu'au renouvellement. Rien n'est supprimé.",
  },
  {
    question: "Où se déroulent les échanges (paiement, remise du produit) ?",
    answer: "Toujours en personne, sur le campus de l'UCAO-UUT. La plateforme ne prend pas en charge les litiges liés à un échange effectué en dehors du campus ou à distance.",
  },
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer: "Rendez-vous sur la page de connexion et cliquez sur \"Mot de passe oublié ?\" pour recevoir un lien de réinitialisation par email.",
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
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="panel p-5">
                <summary className="cursor-pointer font-bold">{item.question}</summary>
                <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ucao-muted dark:text-[#a8b8cc]">
            Vous ne trouvez pas de réponse ?{" "}
            <a className="font-bold text-ucao-red underline" href="mailto:ucaomarketplace2026@gmail.com">
              Contactez-nous
            </a>
            .
          </p>
        </section>
      </main>
    </PageShell>
  );
}
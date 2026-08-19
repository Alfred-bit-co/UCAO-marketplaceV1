import { FileText } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";

export default function ConditionsGeneralesPage() {
  return (
    <PageShell>
      <main>
        <PageHero icon={FileText} eyebrow="Légal" title="Conditions Générales d'Utilisation">
          À lire avant de devenir vendeur ou d&apos;utiliser la plateforme.
        </PageHero>
        <section className="container-ucao max-w-3xl space-y-8 py-[54px] pb-[84px]">
          <div className="panel p-6">
            <h2 className="mb-3 text-xl font-bold">1. Objet</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              UCAO Marketplace met en relation les étudiants acheteurs et vendeurs de la communauté UCAO-UUT. La plateforme sert de vitrine et de mise en relation ; elle ne participe à aucun moment à la transaction entre l&apos;acheteur et le vendeur.
            </p>
          </div>

          <div className="panel p-6">
            <h2 className="mb-3 text-xl font-bold">2. Abonnement vendeur</h2>
            <p className="mb-4 text-ucao-muted dark:text-[#a8b8cc]">
              Publier des produits ou ouvrir un stand nécessite un abonnement mensuel payant, quel que soit le palier choisi :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-ucao-line p-2.5 text-left dark:border-[#2a3a52]">Palier</th>
                    <th className="border-b border-ucao-line p-2.5 text-left dark:border-[#2a3a52]">Prix / mois</th>
                    <th className="border-b border-ucao-line p-2.5 text-left dark:border-[#2a3a52]">Produits max</th>
                    <th className="border-b border-ucao-line p-2.5 text-left dark:border-[#2a3a52]">Stands max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">STANDARD</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">500 FCFA</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">5</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">0</td>
                  </tr>
                  <tr>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">PREMIUM</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">1 500 FCFA</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">10</td>
                    <td className="border-b border-ucao-line p-2.5 dark:border-[#2a3a52]">1</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">VIP</td>
                    <td className="p-2.5">5 000 FCFA</td>
                    <td className="p-2.5">30</td>
                    <td className="p-2.5">5</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-ucao-muted dark:text-[#a8b8cc]">
              Le paiement se fait via Mobile Money (TMoney, Flooz). <strong>Le renouvellement n&apos;est pas automatique</strong> : le Mobile Money ne permettant pas de prélèvement récurrent, chaque vendeur doit relancer lui-même son paiement chaque mois.
            </p>
          </div>

          <div className="panel p-6">
            <h2 className="mb-3 text-xl font-bold">3. Conséquences de la non-reconduction</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              À l&apos;expiration de l&apos;abonnement sans renouvellement, les produits et le stand du vendeur sont masqués publiquement et aucune nouvelle publication n&apos;est possible, jusqu&apos;au renouvellement. Aucune donnée n&apos;est supprimée.
            </p>
          </div>

          <div className="panel border-2 border-ucao-red p-6">
            <h2 className="mb-3 text-xl font-bold text-ucao-red">4. Lieu des échanges et responsabilité</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              Les échanges (remise du produit, paiement en espèces) doivent avoir lieu <strong>au sein du campus de l&apos;UCAO-UUT</strong>. La plateforme ne prend en charge aucun litige résultant d&apos;un échange effectué en dehors du campus ou à distance. L&apos;acheteur est invité à vérifier la marchandise avant tout paiement en espèces. UCAO Marketplace n&apos;est pas responsable des conséquences d&apos;une transaction effectuée en violation de cette règle.
            </p>
          </div>

          <div className="panel p-6">
            <h2 className="mb-3 text-xl font-bold">5. Modération</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              Chaque stand est soumis à validation par l&apos;équipe UCAO Marketplace avant d&apos;être visible publiquement. Un compte peut être suspendu en cas de non-respect de ces conditions.
            </p>
          </div>

          <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">
            Pour toute question, contactez-nous à{" "}
            <a className="font-bold text-ucao-red underline" href="mailto:ucaomarketplace2026@gmail.com">
              ucaomarketplace2026@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </PageShell>
  );
}
import { GraduationCap } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";

export default function AProposPage() {
  return (
    <PageShell>
      <main>
        <PageHero icon={GraduationCap} eyebrow="À propos" title="Notre histoire">
          Un projet né sur le campus, pour le campus.
        </PageHero>
        <section className="container-ucao max-w-2xl py-[54px] pb-[84px]">
          <div className="panel space-y-4 p-8">
            <p>
              UCAO Marketplace est un projet étudiant indépendant, créé par Alfred AYITOU, étudiant à l&apos;UCAO-UUT (Lomé, Togo).
            </p>
            <p>
              L&apos;idée est simple : les étudiants achètent, vendent et proposent des services entre eux tous les jours, souvent de façon informelle et dispersée. UCAO Marketplace centralise ces échanges dans un espace organisé, où chaque vendeur a son propre stand et où les acheteurs trouvent facilement ce qu&apos;ils cherchent.
            </p>
            <p>
              La plateforme met en relation les membres de la communauté UCAO-UUT ; les échanges (paiement, remise du produit) se déroulent ensuite directement entre eux, en personne, sur le campus.
            </p>
            <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">
              UCAO Marketplace n&apos;est pas affilié officiellement à l&apos;administration de l&apos;UCAO-UUT.
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
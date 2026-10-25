import type { Metadata } from "next";
import { ClubCard } from "@/components/club-card";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { CLUBS } from "@/lib/club-catalog";

export const metadata: Metadata = {
  title: "Clubs — UCAO Marketplace",
  description: "Découvrez les clubs étudiants de l'UCAO-UUT et rejoignez celui qui te ressemble.",
};

export default function ClubsPage() {
  return (
    <PageShell>
      <main>
        <PageHero eyebrow="Vie étudiante" title="Clubs UCAO" backgroundImage="/images/hero-clubs.jpg">
          Retrouvez les associations et clubs du campus.
        </PageHero>
        <section className="container-ucao grid gap-12 py-[54px] pb-[84px] lg:gap-16" aria-label="Liste des clubs">
          {CLUBS.map((club, index) => (
            <ClubCard key={club.slug} club={club} reverse={index % 2 === 1} priority={index === 0} />
          ))}
        </section>
      </main>
    </PageShell>
  );
}

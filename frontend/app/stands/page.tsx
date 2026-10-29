import type { Metadata } from "next";
import { Store } from "@/lib/icons";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { StandsAside } from "@/components/stands-aside";
import { StandsBrowser } from "@/components/stands-browser";
import { getLatestStands, getStands } from "@/lib/stands";

export const metadata: Metadata = {
  title: "Stands — UCAO Marketplace",
  description: "Découvrez les stands des vendeurs étudiants de l'UCAO-UUT.",
};

export default async function StandsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || 1, 1);
  const [stands, latest] = await Promise.all([
    getStands({ page, perPage: 12, category: params.category, search: params.search }),
    getLatestStands(3),
  ]);

  return (
    <PageShell>
      <main>
        <PageHero icon={Store} eyebrow="Stands" title="Découvre les stands de ta communauté" backgroundImage="/images/hero-stands.jpg">
          Chaque stand met en avant un projet, une activité ou un service du campus. Contacte les vendeurs directement sur WhatsApp.
        </PageHero>
        <div className="container-ucao grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <StandsBrowser initialData={stands} initialCategory={params.category} initialSearch={params.search} />
          <StandsAside latest={latest} />
        </div>
      </main>
    </PageShell>
  );
}

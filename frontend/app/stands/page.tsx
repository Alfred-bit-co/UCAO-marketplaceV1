import type { Metadata } from "next";
import { Store } from "@/lib/icons";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { StandsBrowser } from "@/components/stands-browser";
import { getStands } from "@/lib/stands";

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
  const stands = await getStands({ page, perPage: 12, category: params.category, search: params.search });

  return (
    <PageShell>
      <main>
        <PageHero icon={Store} eyebrow="Stands" title="Les vitrines étudiantes" backgroundImage="/images/hero-stands.jpg">
          Chaque stand met en avant un projet, une activité ou un service du campus.
        </PageHero>
        <StandsBrowser initialData={stands} initialCategory={params.category} initialSearch={params.search} />
      </main>
    </PageShell>
  );
}

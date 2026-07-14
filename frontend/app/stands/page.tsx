import { Store } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { StandsBrowser } from "@/components/stands-browser";
import { getStands } from "@/lib/stands";

export default async function StandsPage() {
  const stands = await getStands(1, 100);

  return (
    <PageShell>
      <main>
        <PageHero icon={Store} eyebrow="Stands" title="Les vitrines étudiantes">
          Chaque stand met en avant un projet, une activité ou un service du campus.
        </PageHero>
        <StandsBrowser stands={stands.items} />
      </main>
    </PageShell>
  );
}

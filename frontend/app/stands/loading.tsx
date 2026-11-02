import { PageShell } from "@/components/page-shell";
import { HeroSkeleton, StandGridSkeleton } from "@/components/skeletons";

// Affiché instantanément pendant le chargement des stands.
export default function StandsLoading() {
  return (
    <PageShell>
      <main>
        <HeroSkeleton />
        <div className="container-ucao grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="skeleton mb-6 h-[46px] w-full rounded-ucao" />
            <StandGridSkeleton />
          </div>
          <div className="skeleton hidden h-96 rounded-ucao lg:block" />
        </div>
      </main>
    </PageShell>
  );
}

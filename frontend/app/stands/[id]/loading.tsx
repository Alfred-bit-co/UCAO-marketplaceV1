import { PageShell } from "@/components/page-shell";
import { DetailSkeleton } from "@/components/skeletons";

export default function StandLoading() {
  return (
    <PageShell>
      <main>
        <DetailSkeleton />
      </main>
    </PageShell>
  );
}

import { PageShell } from "@/components/page-shell";
import { HeroSkeleton, ProductGridSkeleton } from "@/components/skeletons";

// Affiché instantanément pendant le chargement du catalogue.
export default function ProductsLoading() {
  return (
    <PageShell>
      <main>
        <HeroSkeleton />
        <section className="container-ucao py-[42px]">
          <div className="skeleton mb-6 h-[46px] w-full rounded-ucao" />
          <ProductGridSkeleton />
        </section>
      </main>
    </PageShell>
  );
}
